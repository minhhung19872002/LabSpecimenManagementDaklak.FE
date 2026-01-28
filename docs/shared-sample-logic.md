# Logic xử lý Shared Sample (Mẫu chung)

## Vấn đề cần giải quyết

- Task Lab Hóa có cả chỉ tiêu từ mẫu chung (cần chờ Vi Sinh) và mẫu không chung (có thể thực hiện ngay)
- Yêu cầu: Cho phép thực hiện chỉ tiêu không chung ngay, chỉ block chỉ tiêu chung

## Giải pháp: Indicator-level waiting flag

### 1. Backend - Entity

**File:** `LabSpecimenManagement.Domain/LaboratoryTasks/LaboratoryTaskIndicator.cs`

```csharp
/// <summary>
/// Chỉ tiêu này đang chờ mẫu chung từ lab khác (Vi Sinh)
/// Chỉ áp dụng cho các chỉ tiêu thuộc mẫu chung (IsSharedSample = true)
/// Khi Lab Vi Sinh hoàn thành, flag này sẽ được set = false
/// </summary>
public bool IsWaitingForSharedSample { get; set; }
```

### 2. Backend - Tạo task

**File:** `LabSpecimenManagement.Application/TestRequests/TestRequestAppService.cs`

```csharp
// Task chỉ set IsWaitingForPriorLab = true khi TẤT CẢ indicators đều là shared
var taskShouldWait = isWaitingForPriorLab && !hasNonSharedSample;

// Set shared sample flags
task.IsSharedSampleTask = isSharedSampleTask;
// Only set IsWaitingForPriorLab = true if task actually needs to wait
// (i.e., no non-shared indicators that can proceed immediately)
task.IsWaitingForPriorLab = taskShouldWait; // Không phải isWaitingForPriorLab

// Set initial status based on whether task should wait
if (taskShouldWait)
{
    task.Status = LaboratoryTaskStatus.WaitingSharedSample;
}

// Indicator-level flag - chỉ set cho shared sample indicators ở lab không phải Vi Sinh
foreach (var indicator in indicatorList)
{
    var taskIndicator = new LaboratoryTaskIndicator(...);

    // Set indicator-level waiting flag for shared sample indicators
    // Only applies to non-microbiology labs when there's a microbiology lab involved
    if (indicator.IsSharedSample && labId != microbiologyLabId && microbiologyLabId.HasValue)
    {
        taskIndicator.IsWaitingForSharedSample = true;
    }
}
```

### 3. Backend - Nhận mẫu

**File:** `LabSpecimenManagement.Application/LaboratoryTasks/LaboratoryTaskAppService.SharedSample.cs`

```csharp
public async Task<LaboratoryTaskDto> ReceiveSharedSampleAsync(Guid id, ReceiveSharedSampleDto input)
{
    // ... validation ...

    // Update task
    task.IsWaitingForPriorLab = false;
    task.SampleReceivedDate = input.ReceivedDate ?? Clock.Now;
    task.SampleReceivedNote = input.Note;
    task.Status = LaboratoryTaskStatus.UnderEvaluation;

    await _laboratoryTaskRepository.UpdateAsync(task, autoSave: true);

    // Clear IsWaitingForSharedSample flag on all indicators of this task
    // So that QLKT can now evaluate/assign these indicators
    var taskIndicators = await _laboratoryTaskIndicatorRepository.GetListAsync(
        ti => ti.LaboratoryTaskId == task.Id && ti.IsWaitingForSharedSample);

    foreach (var indicator in taskIndicators)
    {
        indicator.IsWaitingForSharedSample = false;
        await _laboratoryTaskIndicatorRepository.UpdateAsync(indicator, autoSave: true);
    }

    return await MapToDetailDtoAsync(task);
}
```

### 4. Backend - DTO mapping

**Files cần update:**
- `LaboratoryTaskDtoEnricher.cs`
- `LaboratoryTaskAppService.cs` (2 chỗ tạo LaboratoryTaskIndicatorDto)

```csharp
var dto = new LaboratoryTaskIndicatorDto
{
    // ... other fields ...
    IsWaitingForSharedSample = taskIndicator.IsWaitingForSharedSample
};
```

### 5. Frontend - Type

**File:** `src/types/laboratoryTask.ts`

```typescript
export interface LaboratoryTaskIndicatorDto {
  // ... other fields ...
  isWaitingForSharedSample?: boolean;  // Chỉ tiêu này đang chờ mẫu chung từ lab khác (Vi Sinh)
}
```

### 6. Frontend - UI handling

**Files:** `EvaluationIndicatorTable.tsx`, `IndicatorTable.tsx`

```typescript
// Hiển thị tag "Chờ mẫu chung"
const getStatusTag = (record: LaboratoryTaskIndicatorDto) => {
  if (record.isWaitingForSharedSample) {
    return (
      <Tooltip title="Chỉ tiêu này thuộc mẫu chung, đang chờ Lab Vi Sinh hoàn thành">
        <Tag color="gold">Chờ mẫu chung</Tag>
      </Tooltip>
    );
  }
  // ... other status tags
};

// Disable action buttons
const getActionButtons = (record: LaboratoryTaskIndicatorDto) => {
  if (record.isWaitingForSharedSample) {
    return <></>;
  }
  // ... render buttons
};

// Disable checkbox selection
getCheckboxProps: (record: LaboratoryTaskIndicatorDto) => {
  if (record.isWaitingForSharedSample) {
    return { disabled: true, name: record.id };
  }
  // ... other logic
}
```

### 7. Frontend - canEvaluate condition

**File:** `TaskManagementDetail.tsx`

```typescript
<EvaluationIndicatorTable
  // ...
  canEvaluate={
    canApproveResult &&
    (task.status === LaboratoryTaskStatus.UnderEvaluation ||
      task.status === LaboratoryTaskStatus.WaitingCustomerResponse ||
      // Cho phép evaluate khi task đang chờ mẫu chung - indicator nào cần chờ sẽ bị disable riêng
      task.status === LaboratoryTaskStatus.WaitingSharedSample)
  }
/>
```

## Migration

**File:** `Migrations/YYYYMMDDHHMMSS_AddIsWaitingForSharedSample.cs`

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.AddColumn<bool>(
        name: "IsWaitingForSharedSample",
        table: "LaboratoryTaskIndicators",  // Hoặc AppLaboratoryTaskIndicators tùy prefix
        type: "boolean",
        nullable: false,
        defaultValue: false);
}
```

**SQL trực tiếp (nếu cần):**
```sql
ALTER TABLE "AppLaboratoryTaskIndicators"
ADD COLUMN "IsWaitingForSharedSample" boolean NOT NULL DEFAULT false;
```

## Kết quả Logic

| Trường hợp | Task Status | Task.IsWaitingForPriorLab | Indicator.IsWaitingForSharedSample |
|------------|-------------|---------------------------|-------------------------------------|
| Mixed (shared + non-shared) | UnderEvaluation | false | Shared: true, Non-shared: false |
| Chỉ có shared indicators | WaitingSharedSample | true | Tất cả: true |
| Chỉ có non-shared indicators | UnderEvaluation | false | Tất cả: false |

## Flow hoạt động

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GỬI QLKT (CreateLaboratoryTasksAsync)              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Task Lab Vi Sinh                                                     │    │
│  │ - Status: UnderEvaluation                                            │    │
│  │ - IsWaitingForPriorLab: false                                        │    │
│  │ - Indicators: IsWaitingForSharedSample = false (tất cả)              │    │
│  │ → Có thể thực hiện ngay                                              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Task Lab Hóa (Mixed indicators)                                      │    │
│  │ - Status: UnderEvaluation                                            │    │
│  │ - IsWaitingForPriorLab: false                                        │    │
│  │ - Shared indicators: IsWaitingForSharedSample = true (chờ Vi Sinh)   │    │
│  │ - Non-shared indicators: IsWaitingForSharedSample = false            │    │
│  │ → Non-shared có thể thực hiện ngay, Shared phải chờ                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Task Lab Hóa (Chỉ có shared indicators)                              │    │
│  │ - Status: WaitingSharedSample                                        │    │
│  │ - IsWaitingForPriorLab: true                                         │    │
│  │ - Indicators: IsWaitingForSharedSample = true (tất cả)               │    │
│  │ → Phải chờ Vi Sinh gửi mẫu                                           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    LAB VI SINH GỬI MẪU (SendSharedSampleAsync)               │
├─────────────────────────────────────────────────────────────────────────────┤
│ - Set task.SampleSentToNextLab = true                                        │
│ - Set task.SampleSentDate = Now                                              │
│ → Lab Hóa có thể nhận mẫu                                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                   LAB HÓA NHẬN MẪU (ReceiveSharedSampleAsync)                │
├─────────────────────────────────────────────────────────────────────────────┤
│ - Set task.IsWaitingForPriorLab = false                                      │
│ - Set task.Status = UnderEvaluation                                          │
│ - Clear IsWaitingForSharedSample = false cho tất cả indicators               │
│ → Tất cả indicators có thể thực hiện                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Files đã thay đổi

### Backend
1. `LaboratoryTaskIndicator.cs` - Thêm property IsWaitingForSharedSample
2. `LaboratoryTaskIndicatorDto.cs` - Thêm property IsWaitingForSharedSample
3. `TestRequestAppService.cs` - Cập nhật logic CreateLaboratoryTasksAsync
4. `LaboratoryTaskAppService.SharedSample.cs` - Cập nhật ReceiveSharedSampleAsync
5. `LaboratoryTaskDtoEnricher.cs` - Thêm mapping
6. `LaboratoryTaskAppService.cs` - Thêm mapping (2 chỗ)
7. Migration file

### Frontend
1. `laboratoryTask.ts` - Thêm field isWaitingForSharedSample
2. `EvaluationIndicatorTable.tsx` - Hiển thị tag và disable actions
3. `IndicatorTable.tsx` - Hiển thị tag và disable checkbox
4. `TaskManagementDetail.tsx` - Cập nhật canEvaluate condition
