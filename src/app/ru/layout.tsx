import DocumentLanguage from "../components/DocumentLanguage";

export default function RussianLayout({ children }: LayoutProps<"/ru">) {
  return (
    <>
      <DocumentLanguage locale="ru" />
      {children}
    </>
  );
}
