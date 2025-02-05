import React, { Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { ApiErrorBoundary } from "components/common/ApiErrorBoundary";
import { DevToolsToggle } from "components/DevToolsToggle";

import { QueryProvider, useGetInstanceConfiguration } from "core/api";
import {
  InstanceConfigurationResponseEdition,
  InstanceConfigurationResponseTrackingStrategy,
} from "core/api/types/AirbyteClient";
import { config, ConfigServiceProvider } from "core/config";
import { AnalyticsProvider } from "core/services/analytics";
import { OSSAuthService } from "core/services/auth";
import { defaultOssFeatures, defaultEnterpriseFeatures, FeatureService } from "core/services/features";
import { I18nProvider } from "core/services/i18n";
import { BlockerService } from "core/services/navigation";
import { isDevelopment } from "core/utils/isDevelopment";
import { AppMonitoringServiceProvider } from "hooks/services/AppMonitoringService";
import { ConfirmationModalService } from "hooks/services/ConfirmationModal";
import { FormChangeTrackerService } from "hooks/services/FormChangeTracker";
import { ModalServiceProvider } from "hooks/services/Modal";
import { NotificationService } from "hooks/services/Notification";
import { AirbyteThemeProvider } from "hooks/theme/useAirbyteTheme";

import LoadingPage from "./components/LoadingPage";
import en from "./locales/en.json";
import { Routing } from "./pages/routes";

const Services: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => {
  const instanceConfig = useGetInstanceConfiguration();
  const instanceFeatures =
    instanceConfig.edition === InstanceConfigurationResponseEdition.community
      ? defaultOssFeatures
      : defaultEnterpriseFeatures;

  return (
    <AnalyticsProvider
      disableSegment={instanceConfig.trackingStrategy !== InstanceConfigurationResponseTrackingStrategy.segment}
    >
      <AppMonitoringServiceProvider>
        <FeatureService features={instanceFeatures} instanceConfig={instanceConfig}>
          <NotificationService>
            <OSSAuthService>
              <ConfirmationModalService>
                <ModalServiceProvider>
                  <FormChangeTrackerService>
                    <HelmetProvider>{children}</HelmetProvider>
                  </FormChangeTrackerService>
                </ModalServiceProvider>
              </ConfirmationModalService>
            </OSSAuthService>
          </NotificationService>
        </FeatureService>
      </AppMonitoringServiceProvider>
    </AnalyticsProvider>
  );
};

const App: React.FC = () => {
  return (
    <React.StrictMode>
      <AirbyteThemeProvider>
        <I18nProvider locale="en" messages={en}>
          <QueryProvider>
            <BlockerService>
              <Suspense fallback={<LoadingPage />}>
                <ConfigServiceProvider config={config}>
                  <ApiErrorBoundary>
                    <Services>
                      <Routing />
                    </Services>
                  </ApiErrorBoundary>
                </ConfigServiceProvider>
              </Suspense>
            </BlockerService>
          </QueryProvider>
        </I18nProvider>
      </AirbyteThemeProvider>
      {isDevelopment() && <DevToolsToggle />}
    </React.StrictMode>
  );
};

const router = createBrowserRouter([{ path: "*", element: <App /> }]);

const OssApp: React.FC = () => <RouterProvider router={router} />;
export default React.memo(OssApp);
