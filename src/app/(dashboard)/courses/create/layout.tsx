import { WizardProvider } from "./WizardContext";

export default function CreateCourseLayout({ children }: { children: React.ReactNode }) {
  return <WizardProvider>{children}</WizardProvider>;
}
