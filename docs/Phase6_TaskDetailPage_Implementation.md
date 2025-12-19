# Phase 6: Task Detail Page - Implementation Guide

## Tổng quan

Chuyển đổi chức năng "Xem chi tiết" từ Modal sang trang chi tiết đầy đủ với các workflow phức tạp bao gồm:
- Giao việc cho kỹ thuật viên
- Chọn phương pháp thử nghiệm
- Nhập kết quả thí nghiệm
- Phê duyệt/Không duyệt kết quả
- Gửi kết quả

---

## Yêu cầu Business

### Layout Trang Chi tiết (Collapsible Samples)

**Đặc điểm:**
- 1 hợp đồng (TestRequest) có nhiều mẫu (samples)
- Mỗi mẫu có nhiều chỉ tiêu (indicators)
- Sử dụng **Collapse Panel** để group mỗi mẫu, có thể expand/collapse
- Mặc định: Expand tất cả

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [← Quay lại]                                              [Gửi kết quả]    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Title: Số nhận mẫu giao việc: {TestRequestNumber}                          │
│ Subtitle: Số hợp đồng: {ContractNumber} | Trạng thái: {StatusTag}          │
│ Info: Khoa phòng: {LaboratoryName} | QLKT: {TechnicalManagerName}          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌─── Collapse Panel ─────────────────────────────────────────────────────┐  │
│ │                                                                         │  │
│ │ ▼ Mẫu 1: ABC123 - Nước sinh hoạt (5 chỉ tiêu)        [Giao việc]      │  │
│ │ ┌─────────────────────────────────────────────────────────────────────┐│  │
│ │ │ Tên chỉ tiêu │ PP      │ ĐVT  │ Kết quả │ KTV     │ Ngày  │ Duyệt  ││  │
│ │ │──────────────│─────────│──────│─────────│─────────│───────│────────││  │
│ │ │ pH           │[Select▼]│ -    │ [Input] │[Select▼]│ 12/19 │ ✓  ✗   ││  │
│ │ │ BOD5         │[Select▼]│ mg/L │ [Input] │[Select▼]│       │ ✓  ✗   ││  │
│ │ │ COD          │[Select▼]│ mg/L │ [Input] │[Select▼]│       │ ✓  ✗   ││  │
│ │ └─────────────────────────────────────────────────────────────────────┘│  │
│ │                                                                         │  │
│ │ ► Mẫu 2: DEF456 - Nước thải công nghiệp (3 chỉ tiêu)  [Giao việc]     │  │
│ │   (Collapsed - click to expand)                                        │  │
│ │                                                                         │  │
│ │ ► Mẫu 3: GHI789 - Đất nông nghiệp (8 chỉ tiêu)        [Giao việc]     │  │
│ │   (Collapsed - click to expand)                                        │  │
│ │                                                                         │  │
│ └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Columns của Indicator Table

| Column | Mô tả | Type |
|--------|-------|------|
| Tên chỉ tiêu | indicatorName | Display |
| Phương pháp | methodId → Select dropdown | Editable |
| ĐVT (Đơn vị tính) | unit | Display |
| Kết quả | result | Editable Input |
| Kỹ thuật viên | technicianId → Select dropdown | Editable |
| Ngày nhập | entryDate | Display (auto-set) |
| Ngày QL duyệt | approvalDate | Display (auto-set) |
| Trạng thái duyệt | approvalStatus | Display + Actions |

---

## Workflow Chi tiết

### 1. Nút "Giao việc" (Assign Task)
**Trigger:** Click button "Giao việc" trên Sample Card header

**Validation:**
- Tất cả chỉ tiêu trong mẫu đó PHẢI có:
  - `methodId` đã được chọn (NOT NULL)
  - `technicianId` đã được chọn (NOT NULL)
- Nếu validation FAIL → Hiển thị thông báo lỗi

**Success:**
- Update status của các indicator
- Update LaboratoryTask status → AssignedMethod (1)

### 2. Nhập kết quả (Enter Result)
**Người dùng:** Kỹ thuật viên

**Action:** Nhập giá trị vào cột "Kết quả"

**Effect:**
- Auto-save result value
- Auto-set `entryDate` = ngày hệ thống
- Auto-set `enteredBy` = current user
- Update `approvalStatus` = Entered

### 3. Phê duyệt kết quả (Approve Result)
**Người dùng:** Quản lý kỹ thuật

**Actions:**
- **[Phê duyệt]**: Update `approvalStatus` = Approved
- **[Không duyệt]**: Update `approvalStatus` = Rejected, clear result

### 4. Nút "Gửi kết quả" (Send Results)
**Validation:** TẤT CẢ indicators phải có `approvalStatus` = Approved

**Success:** Update LaboratoryTask status → ResultSent (5)

---

## Logic Chuyển Trạng Thái Tự Động

### LaboratoryTask Status

| Điều kiện | Trạng thái |
|-----------|------------|
| Có 1 chỉ tiêu chưa gắn Phương Pháp | NotAssignedMethod (0) |
| Tất cả chỉ tiêu đã được gắn phương pháp | AssignedMethod (1) |
| Có 1 số chỉ tiêu đã có kết quả (chưa đủ) | Testing (2) |
| KTV gửi kết quả hoặc QL chưa duyệt hết | PendingApproval (3) |
| Tất cả chỉ tiêu đã được phê duyệt | Approved (4) |
| QL gửi kết quả | ResultSent (5) |

### Sample Status (Computed - không lưu DB)

| Điều kiện | Trạng thái |
|-----------|------------|
| Có indicator chưa có method/technician | pending |
| Tất cả có method + technician | assigned |
| Có indicator có result | testing |
| Tất cả đã nhập result (Entered) | pendingApproval |
| Tất cả đã Approved | approved |

---

## Implementation Details

### Backend - Domain Layer

#### Enum: IndicatorApprovalStatus
**File:** `src/LabSpecimenManagement.Domain.Shared/LaboratoryTasks/IndicatorApprovalStatus.cs`

```csharp
public enum IndicatorApprovalStatus
{
    Pending = 0,      // Chờ nhập kết quả
    Entered = 1,      // Đã nhập kết quả
    Approved = 2,     // Đã duyệt
    Rejected = 3      // Không duyệt
}
```

#### Entity: LaboratoryTaskIndicator (Extended)
**File:** `src/LabSpecimenManagement.Domain/LaboratoryTasks/LaboratoryTaskIndicator.cs`

Thêm các fields:
```csharp
public Guid? MethodId { get; set; }
public Guid? TechnicianId { get; set; }
public string? Result { get; set; }
public string? Unit { get; set; }
public DateTime? EntryDate { get; set; }
public Guid? EnteredById { get; set; }
public IndicatorApprovalStatus ApprovalStatus { get; set; }
public DateTime? ApprovalDate { get; set; }
public Guid? ApprovedById { get; set; }
public string? RejectionReason { get; set; }
```

### Backend - Application Layer

#### DTOs mới
**Folder:** `src/LabSpecimenManagement.Application.Contracts/LaboratoryTasks/`

| File | Mô tả |
|------|-------|
| `AssignIndicatorDto.cs` | Input: indicatorId, methodId, technicianId |
| `UpdateIndicatorResultDto.cs` | Input: result |
| `ApproveIndicatorDto.cs` | Input: approve (bool), rejectionReason? |
| `MethodLookupDto.cs` | Output: id, code, name, description |

#### AppService Methods
**File:** `src/LabSpecimenManagement.Application/LaboratoryTasks/LaboratoryTaskAppService.cs`

```csharp
// Giao việc cho sample
Task<LaboratoryTaskDto> AssignSampleIndicatorsAsync(
    Guid taskId, Guid sampleId, List<AssignIndicatorDto> assignments)

// Update kết quả
Task<LaboratoryTaskIndicatorDto> UpdateIndicatorResultAsync(
    Guid indicatorId, UpdateIndicatorResultDto input)

// Phê duyệt
Task<LaboratoryTaskIndicatorDto> ApproveIndicatorAsync(
    Guid indicatorId, ApproveIndicatorDto input)

// Gửi kết quả
Task<LaboratoryTaskDto> SendResultsAsync(Guid taskId)

// Lookups
Task<ListResultDto<MethodLookupDto>> GetMethodsByIndicatorAsync(Guid indicatorId)
Task<ListResultDto<UserLookupDto>> GetTechniciansByLaboratoryAsync(Guid laboratoryId)

// Private - Auto update status
private Task UpdateTaskStatusAsync(LaboratoryTask task)
```

### Backend - API Endpoints

**File:** `src/LabSpecimenManagement.HttpApi/Controllers/LaboratoryTaskController.cs`

| Method | Route | Mô tả |
|--------|-------|-------|
| POST | `/{taskId}/samples/{sampleId}/assign` | Giao việc cho sample |
| PUT | `/indicators/{indicatorId}/result` | Cập nhật kết quả |
| POST | `/indicators/{indicatorId}/approve` | Phê duyệt |
| POST | `/{taskId}/send-results` | Gửi kết quả |
| GET | `/methods-lookup?indicatorId={id}` | Lookup methods |
| GET | `/technicians-lookup?laboratoryId={id}` | Lookup technicians |

### Frontend - Types

**File:** `src/types/laboratoryTask.ts`

```typescript
// Enums
export enum IndicatorApprovalStatus {
  Pending = 0,
  Entered = 1,
  Approved = 2,
  Rejected = 3
}

export type SampleStatus = 'pending' | 'assigned' | 'testing' | 'pendingApproval' | 'approved';

// Extended Indicator DTO
export interface LaboratoryTaskIndicatorDto {
  id: string;
  testRequestSampleIndicatorId: string;
  sampleId: string;
  sampleCode?: string;
  sampleName?: string;
  indicatorId: string;
  indicatorCode?: string;
  indicatorName?: string;
  indicatorGroupName?: string;
  unitPrice: number;
  // Workflow fields
  methodId?: string;
  methodName?: string;
  technicianId?: string;
  technicianName?: string;
  result?: string;
  unit?: string;
  entryDate?: string;
  enteredById?: string;
  enteredByName?: string;
  approvalStatus: IndicatorApprovalStatus;
  approvalDate?: string;
  approvedById?: string;
  approvedByName?: string;
  rejectionReason?: string;
}

// Input DTOs
export interface AssignIndicatorInput {
  indicatorId: string;
  methodId?: string;
  technicianId?: string;
}

export interface UpdateIndicatorResultInput {
  result: string;
}

export interface ApproveIndicatorInput {
  approve: boolean;
  rejectionReason?: string;
}

// Lookup DTOs
export interface MethodLookupDto {
  id: string;
  code?: string;
  name: string;
  description?: string;
}

export interface UserLookupDto {
  id: string;
  userName: string;
  name?: string;
  surname?: string;
  displayName: string;
}

// Computed Sample Info
export interface SampleInfo {
  sampleId: string;
  sampleCode?: string;
  sampleName?: string;
  indicatorCount: number;
  indicators: LaboratoryTaskIndicatorDto[];
  sampleStatus: SampleStatus;
  isApproved: boolean;
}
```

### Frontend - Service

**File:** `src/services/laboratoryTaskService.ts`

```typescript
// Assign indicators
assignSampleIndicators: async (taskId, sampleId, assignments) => Promise<LaboratoryTaskDto>

// Update result
updateIndicatorResult: async (indicatorId, input) => Promise<LaboratoryTaskIndicatorDto>

// Approve/Reject
approveIndicator: async (indicatorId, input) => Promise<LaboratoryTaskIndicatorDto>

// Send results
sendResults: async (taskId) => Promise<LaboratoryTaskDto>

// Lookups
getMethodsByIndicator: async (indicatorId) => Promise<ListMethodLookupResult>
getTechniciansByLaboratory: async (laboratoryId) => Promise<ListUserLookupResult>
```

### Frontend - Components

#### TaskManagementDetail.tsx
**File:** `src/pages/TaskManagement/TaskManagementDetail.tsx`

**Features:**
- Header với thông tin task và nút "Gửi kết quả"
- Collapse panels cho mỗi sample
- Computed sample status từ indicators
- "Gửi kết quả" enabled khi ALL samples approved

#### IndicatorTable.tsx
**File:** `src/pages/TaskManagement/components/IndicatorTable.tsx`

**Features:**
- Bảng chỉ tiêu trong mỗi Collapse Panel
- Select dropdown cho Method và Technician
- Input cho Result
- Buttons Duyệt/Từ chối cho trạng thái Entered
- Modal nhập lý do từ chối

---

## Files Summary

### Files tạo mới

**Backend:**
1. `src/LabSpecimenManagement.Domain.Shared/LaboratoryTasks/IndicatorApprovalStatus.cs`
2. `src/LabSpecimenManagement.Application.Contracts/LaboratoryTasks/AssignIndicatorDto.cs`
3. `src/LabSpecimenManagement.Application.Contracts/LaboratoryTasks/UpdateIndicatorResultDto.cs`
4. `src/LabSpecimenManagement.Application.Contracts/LaboratoryTasks/ApproveIndicatorDto.cs`
5. `src/LabSpecimenManagement.Application.Contracts/LaboratoryTasks/MethodLookupDto.cs`
6. Migration file + SQL script

**Frontend:**
1. `src/pages/TaskManagement/TaskManagementDetail.tsx`
2. `src/pages/TaskManagement/components/IndicatorTable.tsx`

### Files cần sửa

**Backend:**
1. `LaboratoryTaskIndicator.cs` - Thêm workflow fields
2. `LabSpecimenManagementDbContext.cs` - Update config
3. `LaboratoryTaskDto.cs` - Extend indicator DTO
4. `ILaboratoryTaskAppService.cs` - Thêm interface methods
5. `LaboratoryTaskAppService.cs` - Implement methods
6. `LaboratoryTaskController.cs` - Thêm endpoints

**Frontend:**
1. `src/types/laboratoryTask.ts` - Thêm types
2. `src/services/laboratoryTaskService.ts` - Thêm API methods
3. `src/App.tsx` - Thêm route `/task/:id`
4. `src/pages/TaskManagement/TaskManagementList.tsx` - Navigate thay vì modal

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    TASK DETAIL PAGE FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Load Task Detail                                            │
│     └─→ GET /api/v1/laboratory-tasks/{id}                       │
│         └─→ Returns task with indicators grouped by sample      │
│                                                                  │
│  2. Load Lookups (parallel)                                     │
│     ├─→ GET /technicians-lookup?laboratoryId={id}               │
│     └─→ GET /methods-lookup?indicatorId={id}                    │
│                                                                  │
│  3. User selects Method + Technician for each indicator         │
│     └─→ Local state only (not saved yet)                        │
│                                                                  │
│  4. Click "Giao việc" on Sample Card                            │
│     ├─→ Validate: all indicators have method + technician       │
│     ├─→ POST /{taskId}/samples/{sampleId}/assign                │
│     └─→ Reload task data                                        │
│                                                                  │
│  5. Technician enters result                                    │
│     ├─→ Input onBlur triggers save                              │
│     ├─→ PUT /indicators/{id}/result                             │
│     └─→ Auto-sets entryDate = now, approvalStatus = Entered     │
│                                                                  │
│  6. Manager approves/rejects                                    │
│     ├─→ POST /indicators/{id}/approve                           │
│     └─→ If rejected: clears result, resets to Pending           │
│                                                                  │
│  7. All indicators approved → Enable "Gửi kết quả"              │
│     ├─→ POST /{taskId}/send-results                             │
│     └─→ Updates task status → ResultSent (5)                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Status Workflow Diagram

```
LaboratoryTask Status:
┌────────────────────┐
│ NotAssignedMethod  │◄─── Initial state (tự động tạo)
│       (0)          │
└─────────┬──────────┘
          │ [Giao việc] - khi TẤT CẢ indicators có method + technician
          ▼
┌────────────────────┐
│  AssignedMethod    │
│       (1)          │
└─────────┬──────────┘
          │ [Bắt đầu TN] - khi có ít nhất 1 result được nhập
          ▼
┌────────────────────┐
│     Testing        │
│       (2)          │
└─────────┬──────────┘
          │ [Chờ duyệt] - khi có indicators đang chờ duyệt
          ▼
┌────────────────────┐
│ PendingApproval    │
│       (3)          │
└─────────┬──────────┘
          │ [Duyệt] - khi TẤT CẢ indicators được approve
          ▼
┌────────────────────┐
│     Approved       │
│       (4)          │
└─────────┬──────────┘
          │ [Gửi kết quả]
          ▼
┌────────────────────┐
│    ResultSent      │
│       (5)          │
└────────────────────┘

Indicator ApprovalStatus:
┌─────────┐    ┌─────────┐    ┌──────────┐
│ Pending │───▶│ Entered │───▶│ Approved │
│   (0)   │    │   (1)   │    │   (2)    │
└─────────┘    └────┬────┘    └──────────┘
                    │
                    ▼
               ┌──────────┐
               │ Rejected │──▶ [Reset về Pending]
               │   (3)    │
               └──────────┘
```

---

## Database Migration

### SQL Script
**File:** `scripts/add_laboratory_task_indicator_fields.sql`

```sql
-- Add new columns
ALTER TABLE "AppLaboratoryTaskIndicators" ADD COLUMN IF NOT EXISTS "MethodId" uuid NULL;
ALTER TABLE "AppLaboratoryTaskIndicators" ADD COLUMN IF NOT EXISTS "TechnicianId" uuid NULL;
ALTER TABLE "AppLaboratoryTaskIndicators" ADD COLUMN IF NOT EXISTS "Result" character varying(500) NULL;
ALTER TABLE "AppLaboratoryTaskIndicators" ADD COLUMN IF NOT EXISTS "Unit" character varying(50) NULL;
ALTER TABLE "AppLaboratoryTaskIndicators" ADD COLUMN IF NOT EXISTS "EntryDate" timestamp without time zone NULL;
ALTER TABLE "AppLaboratoryTaskIndicators" ADD COLUMN IF NOT EXISTS "EnteredById" uuid NULL;
ALTER TABLE "AppLaboratoryTaskIndicators" ADD COLUMN IF NOT EXISTS "ApprovalStatus" integer NOT NULL DEFAULT 0;
ALTER TABLE "AppLaboratoryTaskIndicators" ADD COLUMN IF NOT EXISTS "ApprovalDate" timestamp without time zone NULL;
ALTER TABLE "AppLaboratoryTaskIndicators" ADD COLUMN IF NOT EXISTS "ApprovedById" uuid NULL;
ALTER TABLE "AppLaboratoryTaskIndicators" ADD COLUMN IF NOT EXISTS "RejectionReason" character varying(1000) NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS "IX_AppLaboratoryTaskIndicators_MethodId" ON "AppLaboratoryTaskIndicators" ("MethodId");
CREATE INDEX IF NOT EXISTS "IX_AppLaboratoryTaskIndicators_TechnicianId" ON "AppLaboratoryTaskIndicators" ("TechnicianId");
CREATE INDEX IF NOT EXISTS "IX_AppLaboratoryTaskIndicators_ApprovalStatus" ON "AppLaboratoryTaskIndicators" ("ApprovalStatus");
```

---

## Testing Checklist

- [ ] Load task detail page với các indicators
- [ ] Expand/Collapse sample panels
- [ ] Select method cho indicator
- [ ] Select technician cho indicator
- [ ] Click "Giao việc" - validation fail (thiếu method/technician)
- [ ] Click "Giao việc" - success
- [ ] Nhập kết quả - auto save
- [ ] Duyệt kết quả
- [ ] Từ chối kết quả với lý do
- [ ] "Gửi kết quả" button disabled khi chưa đủ
- [ ] "Gửi kết quả" button enabled khi all approved
- [ ] Gửi kết quả - chuyển status
- [ ] Auto-update task status theo logic

---

*Document created: 2025-12-19*
*Last updated: 2025-12-19*
