import React from "react";
import { Card, Button, Spin, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { useTaskManagementDetail } from "./hooks";
import { TaskDetailHeader, TaskSampleList } from "./components/detail";

const { Text } = Typography;

const TaskManagementDetail: React.FC = () => {
  const navigate = useNavigate();
  const {
    // Data
    task,
    loading,
    actionLoading,
    methods,
    technicians,
    sampleList,
    allSamplesApproved,
    canEditTask,

    // Collapse state
    activeKeys,
    setActiveKeys,

    // Handlers
    handleBack,
    handleMethodChange,
    handleTechnicianChange,
    handleAssignSample,
    handleApprove,
    handleSendResults,
  } = useTaskManagementDetail();

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!task) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: 50 }}>
          <Text type="secondary">Không tìm thấy công việc</Text>
          <br />
          <Button type="link" onClick={() => navigate("/tasks")}>
            Quay lại danh sách
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <TaskDetailHeader
        task={task}
        allSamplesApproved={allSamplesApproved}
        actionLoading={actionLoading}
        onBack={handleBack}
        onSendResults={handleSendResults}
      />

      <TaskSampleList
        sampleList={sampleList}
        activeKeys={activeKeys}
        onActiveKeysChange={setActiveKeys}
        methods={methods}
        technicians={technicians}
        canEditTask={canEditTask}
        actionLoading={actionLoading}
        onMethodChange={handleMethodChange}
        onTechnicianChange={handleTechnicianChange}
        onAssignSample={handleAssignSample}
        onApprove={handleApprove}
      />
    </div>
  );
};

export default TaskManagementDetail;
