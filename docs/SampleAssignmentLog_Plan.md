# Plan: Thêm Tab "Sổ nhận mẫu giao việc" trong Quản lý chất lượng

## Yêu cầu từ khách hàng

### Cấu trúc mới của trang Quản lý chất lượng:
- **Tab 1: Quản lý báo cáo** - View hiện tại (giữ nguyên)
- **Tab 2: Sổ nhận mẫu giao việc** - Tab mới

### Tab "Sổ nhận mẫu giao việc" - Chi tiết:

**Toolbar:** Tương tự tab hiện tại (search, filter, reload)

**Table Columns:**
| STT | Tên cột | Nguồn dữ liệu | Ghi chú |
|-----|---------|---------------|---------|
| 1 | Số hợp đồng | TestRequest.contractNumber | |
| 2 | Mã số mẫu | Sample.sampleCode | Row span theo mẫu |
| 3 | Tên mẫu | Sample.sampleName | Row span theo mẫu |
| 4 | Lượng mẫu gửi | Sample.sampleQuantity | Row span theo mẫu |
| 5 | Tình trạng mẫu | Sample.status | Row span theo mẫu |
| 6 | Ngày chuyển | Indicator.transferDate | |
| 7 | Ngày YC xong | TestRequest.requestCompletionDate | |
| 8 | Thời gian TN | Indicator.testDate | |
| 9 | Tên chỉ tiêu | Indicator.indicatorName | |
| 10 | Phương pháp | Indicator.methodName | |
| 11 | ĐVT | Indicator.unit | |
| 12 | Kết quả | LaboratoryTaskIndicator.result | |
| 13 | QL kỹ thuật | LaboratoryTask.technicalManagerName | Group nếu nhiều chỉ tiêu cùng QLKT |
| 14 | Kỹ thuật viên | LaboratoryTaskIndicator.technicianName | Group nếu nhiều chỉ tiêu cùng KTV |
| 15 | Ngày nhập | LaboratoryTaskIndicator.entryDate | Group nếu cùng ngày |
| 16 | Ngày QL duyệt | LaboratoryTaskIndicator.approvalDate | Group nếu cùng ngày |
| 17 | Tình trạng | TestRequest.status | Status của phiếu TN |

### Row Spanning Logic:
- Các chỉ tiêu có chung mẫu → merge các cột: Mã số mẫu, Tên mẫu, Lượng mẫu gửi, Tình trạng mẫu
- QLKT, KTV, Ngày nhập, Ngày QL duyệt có thể group nếu nhiều chỉ tiêu cùng giá trị

### Màu sắc Highlight:

| Màu | Hex | Điều kiện |
|-----|-----|-----------|
| **Đỏ** | #FFCCC7 | Phiếu TN có status = Mới (0) hoặc Đang xem xét YC (11) **HOẶC** chỉ tiêu có ApprovalStatus = Chưa bắt đầu/Pending (0) hoặc Đang thử nghiệm (testing) |
| **Vàng** | #FFF7E6 | Chỉ tiêu có ApprovalStatus = Chờ duyệt Kết quả (Entered = 1) |
| **Tím** | #EFDBFF | Chỉ tiêu ở QLCL có QualityIndicatorApprovalStatus = Chờ phê duyệt (PendingApproval = 0) |
| **Không highlight** | - | Đã phát hành báo cáo cho chỉ tiêu **HOẶC** Phiếu TN status = Hoàn Thành (9) |

---

## Xác nhận với khách hàng

1. **Sorting**: Sort mặc định theo **Ngày YC xong (RequestCompletionDate) tăng dần** (ASC)

2. **Click action**: Double-click row → **Navigate sang QualityManagementDetail page** của phiếu TN đó

3. **"Đang thử nghiệm"**: Dựa trên **TestingStatus = InProgress** (cần thêm field này vào DTO)

---

## Implementation Plan

### Approach: New Tab với Flat Indicator List

Tab mới sẽ hiển thị **flat list của tất cả indicators** (không group theo task như tab hiện tại), với row spanning cho các chỉ tiêu cùng mẫu.

### Phase 1: Backend - New API Endpoint

**Cần endpoint mới** vì data structure khác với endpoint hiện tại:
- Hiện tại: Group by Task → Indicators
- Mới: Flat list indicators với thông tin Sample, TestRequest, QLKT, KTV

**File: `QualityManagementController.cs`**

```csharp
[HttpGet("sample-assignment-log")]
public async Task<PagedResultDto<SampleAssignmentLogDto>> GetSampleAssignmentLogAsync(
    GetSampleAssignmentLogInput input)
```

**New DTO: `SampleAssignmentLogDto`**
```csharp
public class SampleAssignmentLogDto
{
    // TestRequest info
    public Guid TestRequestId { get; set; }
    public string ContractNumber { get; set; }
    public TestRequestStatus TestRequestStatus { get; set; }
    public DateTime? RequestCompletionDate { get; set; }

    // Sample info
    public Guid SampleId { get; set; }
    public string SampleCode { get; set; }
    public string SampleName { get; set; }
    public string SampleQuantity { get; set; }
    public SampleStatus SampleStatus { get; set; }

    // Indicator info
    public Guid IndicatorId { get; set; }
    public string IndicatorName { get; set; }
    public string MethodName { get; set; }
    public string Unit { get; set; }
    public DateTime? TransferDate { get; set; }
    public DateTime? TestDate { get; set; }
    public string Result { get; set; }

    // Assignment info
    public string TechnicalManagerName { get; set; }
    public string TechnicianName { get; set; }
    public DateTime? EntryDate { get; set; }
    public DateTime? ApprovalDate { get; set; }

    // Status for highlighting
    public IndicatorApprovalStatus IndicatorApprovalStatus { get; set; }
    public TestingStatus? TestingStatus { get; set; }
    public QualityIndicatorApprovalStatus? QualityApprovalStatus { get; set; }
    public bool IsReportPublished { get; set; }
}
```

### Phase 2: Frontend - Refactor QualityManagementList

**Step 1: Add Tabs Component**

```tsx
// QualityManagementList.tsx
<Tabs defaultActiveKey="reports" onChange={handleTabChange}>
  <TabPane tab="Quản lý báo cáo" key="reports">
    {/* Existing content */}
  </TabPane>
  <TabPane tab="Sổ nhận mẫu giao việc" key="assignment-log">
    <SampleAssignmentLogTab />
  </TabPane>
</Tabs>
```

**Step 2: Create New Component**

**File: `components/SampleAssignmentLogTab.tsx`** (NEW)

- Toolbar: Search, Status filter, Reload (copy từ tab hiện tại)
- Table với columns mới và row spanning
- Row highlighting logic

### Phase 3: Row Spanning Implementation

```tsx
// Calculate rowSpan for sample-level columns
const processDataForRowSpan = (data: SampleAssignmentLogDto[]) => {
  // Group by sampleId, count rows per sample
  const sampleRowCounts = new Map<string, number>();
  data.forEach(item => {
    sampleRowCounts.set(
      item.sampleId,
      (sampleRowCounts.get(item.sampleId) || 0) + 1
    );
  });

  // Mark first row of each sample group
  const seen = new Set<string>();
  return data.map(item => ({
    ...item,
    sampleRowSpan: seen.has(item.sampleId) ? 0 : sampleRowCounts.get(item.sampleId),
    _seen: seen.add(item.sampleId)
  }));
};

// Column definition with onCell
{
  title: 'Mã số mẫu',
  dataIndex: 'sampleCode',
  onCell: (record) => ({
    rowSpan: record.sampleRowSpan
  })
}
```

### Phase 4: Row Highlighting Logic

```tsx
const getRowClassName = (record: SampleAssignmentLogDto) => {
  // Skip if report published or completed
  if (record.isReportPublished || record.testRequestStatus === TestRequestStatus.Completed) {
    return '';
  }

  // Purple: QLCL pending approval
  if (record.qualityApprovalStatus === QualityIndicatorApprovalStatus.PendingApproval) {
    return 'row-purple';
  }

  // Yellow: Waiting for result approval (Entered)
  if (record.indicatorApprovalStatus === IndicatorApprovalStatus.Entered) {
    return 'row-yellow';
  }

  // Red: New/UnderReview OR Pending/Testing
  if (
    record.testRequestStatus === TestRequestStatus.New ||
    record.testRequestStatus === TestRequestStatus.UnderReview ||
    record.indicatorApprovalStatus === IndicatorApprovalStatus.Pending ||
    record.testingStatus === TestingStatus.InProgress
  ) {
    return 'row-red';
  }

  return '';
};
```

**CSS:**
```css
.row-red { background-color: #FFCCC7 !important; }
.row-yellow { background-color: #FFF7E6 !important; }
.row-purple { background-color: #EFDBFF !important; }
```

### Phase 5: Pagination với Row Span

**Vấn đề:** Khi pagination, các indicators cùng sample có thể bị tách ra 2 trang khác nhau, gây lỗi row span.

**Giải pháp:** Backend sử dụng **sample-aware pagination** - đảm bảo tất cả indicators của cùng sample nằm trên cùng một trang.

```csharp
/// <summary>
/// Get a page of items while ensuring all indicators of the same sample stay together.
/// If a sample spans across page boundary, include all its indicators on the current page.
/// </summary>
private static List<T> GetSampleAwarePage<T>(List<T> allItems, int skipCount, int maxResultCount)
{
    // 1. Find actual start index (snap to sample boundary)
    // 2. Take items, but include complete sample at the end
}
```

---

## Files đã thay đổi

### Backend

| File | Thay đổi |
|------|----------|
| `QualityManagement/SampleAssignmentLogDto.cs` | **NEW** - DTO cho flat indicator list |
| `QualityManagement/GetSampleAssignmentLogInput.cs` | **NEW** - Input DTO với paging, filter |
| `IQualityManagementAppService.cs` | Thêm method `GetSampleAssignmentLogAsync` |
| `QualityManagementAppService.cs` | Implement method mới + `GetSampleAwarePage` helper |
| `QualityManagementController.cs` | Thêm endpoint `GET /sample-assignment-log` |

### Frontend

| File | Thay đổi |
|------|----------|
| `QualityManagementList.tsx` | Wrap trong Tabs, Statistics Cards nằm trên tabs |
| `components/SampleAssignmentLogTab.tsx` | **NEW** - Tab component |
| `components/SampleAssignmentLogTab.css` | **NEW** - Row highlight styles |
| `hooks/useSampleAssignmentLog.ts` | **NEW** - Data fetching hook |
| `hooks/index.ts` | Export useSampleAssignmentLog |
| `qualityManagementService.ts` | Thêm API call `getSampleAssignmentLog` |
| `types/qualityManagement.ts` | Thêm `SampleAssignmentLogDto`, `GetSampleAssignmentLogInput` interfaces |

---

## Verification Plan

### 1. Backend API
- Call `GET /api/v1/quality-management/sample-assignment-log`
- Verify response có đúng structure với thông tin Sample, Indicator, QLKT, KTV
- Test paging và filter
- Test sample-aware pagination (indicators cùng sample không bị tách trang)

### 2. Tab Navigation
- Click "Sổ nhận mẫu giao việc" tab → Hiển thị table mới
- Click "Quản lý báo cáo" tab → Hiển thị view cũ (không thay đổi)

### 3. Table Display
- Các chỉ tiêu cùng mẫu có row span đúng
- Columns hiển thị đúng thông tin

### 4. Row Highlighting
- Phiếu TN mới (status=0) → Row màu đỏ
- Chỉ tiêu chờ duyệt KQ (Entered) → Row màu vàng
- Chỉ tiêu chờ QLCL duyệt → Row màu tím
- Đã phát hành hoặc Hoàn thành → Không highlight

### 5. Toolbar Functions
- Search hoạt động
- Status filter hoạt động
- Reload hoạt động

### 6. Double-click Action
- Double-click row → Navigate sang `/quality-management/{qualityTaskId}`

---

## Ghi chú kỹ thuật

### Row Span với Pagination
- Các trang khác (Testing Detail, TaskManagement Detail, QualityManagement Detail) sử dụng **Collapse panels** cho mỗi Sample với `pagination={false}` nên không gặp vấn đề
- Tab "Sổ nhận mẫu giao việc" cần pagination vì có thể có nhiều data → phải xử lý ở backend với `GetSampleAwarePage`

### Enum Mapping
- `IndicatorApprovalStatus` (Backend) = `IndicatorApprovalStatus` (Frontend) - từ `laboratoryTask.ts`
- `TestingStatus` (Backend) = `TestingStatus` (Frontend) - từ `testing.ts`
- `QualityIndicatorApprovalStatus` (Backend) = `QualityIndicatorApprovalStatus` (Frontend) - từ `qualityManagement.ts`
- `TestRequestStatus` (Backend) = `TestRequestStatus` (Frontend) - từ `testRequest.ts`
