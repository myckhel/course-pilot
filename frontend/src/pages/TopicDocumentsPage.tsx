import { Card, Typography } from "antd";

const { Title } = Typography;

function TopicDocumentsPage() {
  return (
    <div className="p-6">
      <Card>
        <Title level={2}>Topic Documents</Title>
        <p>This page will show documents for a specific topic.</p>
      </Card>
    </div>
  );
}

export default TopicDocumentsPage;
