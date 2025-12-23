import React from "react";
import { Modal, Table, Button, Tag, Spin } from "antd";
import dayjs from "dayjs";
import { SampleForSelectionDto } from "../../../../store/api/testRequestApi";

interface BM01ModalProps {
  visible: boolean;
  samples: SampleForSelectionDto[];
  selectedSampleId: string | null;
  loading: boolean;
  generating: boolean;
  canGenerate: boolean;
  onSelectSample: (sampleId: string) => void;
  onGenerate: () => void;
  onCancel: () => void;
}

const BM01Modal: React.FC<BM01ModalProps> = ({
  visible,
  samples,
  selectedSampleId,
  loading,
  generating,
  canGenerate,
  onSelectSample,
  onGenerate,
  onCancel,
}) => {
  const columns = [
    {
      title: "Mã mẫu",
      dataIndex: "sampleCode",
      key: "sampleCode",
      width: 120,
    },
    {
      title: "Tên mẫu",
      dataIndex: "sampleName",
      key: "sampleName",
      width: 200,
    },
    {
      title: "Trạng thái XN",
      dataIndex: "testingStatus",
      key: "testingStatus",
      width: 150,
      render: (status: string, record: SampleForSelectionDto) => (
        <Tag color={record.canGenerateResult ? "success" : "default"}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Ngày YC xong",
      dataIndex: "requestedCompletionDate",
      key: "requestedCompletionDate",
      width: 120,
      render: (date: string) => date ? dayjs(date).format("DD/MM/YYYY") : "-",
    },
  ];

  return (
    <Modal
      title="Chọn mẫu để xuất báo cáo BM01"
      open={visible}
      onCancel={onCancel}
      width={700}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={generating}
          disabled={!canGenerate}
          onClick={onGenerate}
        >
          Xuất báo cáo
        </Button>,
      ]}
    >
      <Spin spinning={loading}>
        <Table
          dataSource={samples}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
          rowSelection={{
            type: "radio",
            selectedRowKeys: selectedSampleId ? [selectedSampleId] : [],
            onChange: (selectedRowKeys) => {
              onSelectSample(selectedRowKeys[0] as string);
            },
            getCheckboxProps: (record: SampleForSelectionDto) => ({
              disabled: !record.canGenerateResult,
            }),
          }}
          onRow={(record) => ({
            onClick: () => {
              if (record.canGenerateResult) {
                onSelectSample(record.id);
              }
            },
            style: {
              cursor: record.canGenerateResult ? "pointer" : "not-allowed",
              opacity: record.canGenerateResult ? 1 : 0.6,
            },
          })}
          locale={{ emptyText: "Không có mẫu nào" }}
        />
        {samples.some(s => !s.canGenerateResult) && (
          <div style={{ marginTop: 12, color: "#888", fontSize: 12 }}>
            * Chỉ có thể xuất báo cáo cho các mẫu có trạng thái "Đã gửi kết quả"
          </div>
        )}
      </Spin>
    </Modal>
  );
};

export default BM01Modal;
