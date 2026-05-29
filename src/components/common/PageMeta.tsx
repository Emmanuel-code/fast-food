import { HelmetProvider, Helmet } from "react-helmet-async";
import { tenantConfig } from "@/config/tenantConfig";

const PageMeta = ({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) => (
  <Helmet>
    <title>{title ? `${title} | ${tenantConfig.appName}` : tenantConfig.appName}</title>
    <meta name="description" content={description || tenantConfig.description} />
  </Helmet>
);

export const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider>
    {children}
  </HelmetProvider>
);

export default PageMeta;

