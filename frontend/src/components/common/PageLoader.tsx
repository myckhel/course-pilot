import { Spin } from "antd";

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spin size="large" />
    </div>
  );
}

export default PageLoader;
