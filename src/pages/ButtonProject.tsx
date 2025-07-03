
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProjectsDisplay } from "@/components/projects/ProjectsDisplay";

const ButtonProject = () => {
  return (
    <MainLayout>
      <PageContainer 
        title="Button Project" 
        subtitle="Interactive project management with action buttons"
      >
        <ProjectsDisplay />
      </PageContainer>
    </MainLayout>
  );
};

export default ButtonProject;
