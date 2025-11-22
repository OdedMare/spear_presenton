import { TemplateBuilderClient } from "./TemplateBuilderClient";

export const metadata = {
  title: "Template Builder · Presenton",
};

export default function TemplateBuilderPage() {
  return (
    <div className="p-6">
      <TemplateBuilderClient />
    </div>
  );
}

