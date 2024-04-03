import classNames from "classnames";
import { useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

import { Heading } from "components/ui/Heading";
import { Icon } from "components/ui/Icon";
import { Link } from "components/ui/Link";
import { Text } from "components/ui/Text";
import { Tooltip } from "components/ui/Tooltip";

import { ConnectorIds, SvgIcon } from "area/connector/utils";
import { useCurrentWorkspace, useSourceDefinitionList, useDestinationDefinitionList } from "core/api";
import { DestinationDefinitionRead, SourceDefinitionRead } from "core/api/types/AirbyteClient";
import { useIntent } from "core/utils/rbac";
import { useExperiment } from "hooks/services/Experiment";
import { ConnectionRoutePaths, DestinationPaths, RoutePaths } from "pages/routePaths";

import { HighlightIndex, AirbyteIllustration } from "./AirbyteIllustration";
import styles from "./ConnectionOnboarding.module.scss";
import { ConnectionOnboardingConnectorLink } from "./ConnectionOnboardingConnectorLink";
import { SOURCE_DEFINITION_PARAM } from "../CreateConnection/CreateNewSource";
import { NEW_SOURCE_TYPE, SOURCE_TYPE_PARAM } from "../CreateConnection/SelectSource";

interface ConnectionOnboardingProps {
  onCreate: (sourceConnectorTypeId?: string) => void;
}

const DEFAULT_SOURCES = [
  ConnectorIds.Sources.FacebookMarketing,
  ConnectorIds.Sources.Postgres,
  ConnectorIds.Sources.GoogleSheets,
];

const DEFAULT_DESTINATIONS = [
  ConnectorIds.Destinations.BigQuery,
  ConnectorIds.Destinations.Snowflake,
  ConnectorIds.Destinations.Postgres,
];

interface ConnectorSpecificationMap {
  sourceDefinitions: Record<string, SourceDefinitionRead>;
  destinationDefinitions: Record<string, DestinationDefinitionRead>;
}

const roundConnectorCount = (connectors: Record<string, SourceDefinitionRead | DestinationDefinitionRead>): number => {
  return Math.floor(Object.keys(connectors).length / 10) * 10;
};

/**
 * Gets all available connectors and convert them to a map by id, to access them faster.
 */
export const useConnectorSpecificationMap = (): ConnectorSpecificationMap => {
  const { sourceDefinitions: sourceDefinitionsList } = useSourceDefinitionList();
  const { destinationDefinitions: destinationDefinitionsList } = useDestinationDefinitionList();

  const sourceDefinitions = useMemo(
    () =>
      sourceDefinitionsList.reduce<Record<string, SourceDefinitionRead>>((map, def) => {
        map[def.sourceDefinitionId] = def;
        return map;
      }, {}),
    [sourceDefinitionsList]
  );

  const destinationDefinitions = useMemo(
    () =>
      destinationDefinitionsList.reduce<Record<string, DestinationDefinitionRead>>((map, def) => {
        map[def.destinationDefinitionId] = def;
        return map;
      }, {}),
    [destinationDefinitionsList]
  );

  return { sourceDefinitions, destinationDefinitions };
};

export const ConnectionOnboarding: React.FC<ConnectionOnboardingProps> = () => {
  const { formatMessage } = useIntl();
  const { workspaceId } = useCurrentWorkspace();
  const { sourceDefinitions, destinationDefinitions } = useConnectorSpecificationMap();
  const canCreateConnection = useIntent("CreateConnection", { workspaceId });

  const [highlightedSource, setHighlightedSource] = useState<HighlightIndex>(1);
  const [highlightedDestination, setHighlightedDestination] = useState<HighlightIndex>(0);

  const sourceIds = useExperiment("connection.onboarding.sources", "").split(",");
  const destinationIds = useExperiment("connection.onboarding.destinations", "").split(",");

  const createConnectionPath = `/${RoutePaths.Workspaces}/${workspaceId}/${RoutePaths.Connections}/${ConnectionRoutePaths.ConnectionNew}`;
  const createDestinationBasePath = `/${RoutePaths.Workspaces}/${workspaceId}/${RoutePaths.Destination}/${DestinationPaths.SelectDestinationNew}`;

  const createSourcePath = (sourceDefinitionId?: string) => {
    const sourceDefinitionPath = sourceDefinitionId ? `&${SOURCE_DEFINITION_PARAM}=${sourceDefinitionId}` : "";

    return `${createConnectionPath}?${SOURCE_TYPE_PARAM}=${NEW_SOURCE_TYPE}${sourceDefinitionPath}`;
  };

  const sources = useMemo(
    () =>
      DEFAULT_SOURCES.map(
        (defaultId, index) => sourceDefinitions[sourceIds[index] || defaultId] ?? sourceDefinitions[defaultId]
      ),
    [sourceDefinitions, sourceIds]
  );

  const destinations = useMemo(
    () =>
      DEFAULT_DESTINATIONS.map(
        (defaultId, index) =>
          destinationDefinitions[destinationIds[index] || defaultId] ?? destinationDefinitions[defaultId]
      ),
    [destinationDefinitions, destinationIds]
  );

  const moreSourcesTooltip = formatMessage(
    { id: "connection.onboarding.moreSources" },
    { count: roundConnectorCount(sourceDefinitions) }
  );

  const moreDestinationsTooltip = formatMessage(
    { id: "connection.onboarding.moreDestinations" },
    { count: roundConnectorCount(destinationDefinitions) }
  );

  return (
    <div className={styles.container}>
      <Heading as="h2" size="lg" centered className={styles.heading}>
        <FormattedMessage id="connection.onboarding.title" />
      </Heading>
      <div className={styles.connectors}>
        <div className={styles.sources}>
          <Text bold as="div" className={styles.sourcesTitle}>
            <Tooltip
              control={
                <span>
                  <FormattedMessage id="connection.onboarding.sources" /> <Icon type="question" size="sm" />
                </span>
              }
            >
              <FormattedMessage id="connection.onboarding.sourcesDescription" />
            </Tooltip>
          </Text>
          {sources.map((source, index) => {
            const tooltipText = formatMessage({ id: "connection.onboarding.addSource" }, { source: source?.name });
            return (
              <ConnectionOnboardingConnectorLink
                key={source?.sourceDefinitionId}
                testId={`onboardingSource-${index}`}
                connector={source}
                connectorType="source"
                to={createSourcePath(source?.sourceDefinitionId)}
                tooltipText={tooltipText}
                onMouseEnter={() => setHighlightedSource(index as HighlightIndex)}
              >
                <div className={styles.connectorIcon}>
                  <SvgIcon src={source?.icon} />
                </div>
              </ConnectionOnboardingConnectorLink>
            );
          })}

          <Tooltip
            placement="right"
            control={
              <ConnectionOnboardingConnectorLink
                testId="onboardingSource-more"
                to={createSourcePath()}
                tooltipText={moreSourcesTooltip}
                onMouseEnter={() => setHighlightedSource(3)}
              >
                <Icon type="plus" className={styles.moreIcon} />
              </ConnectionOnboardingConnectorLink>
            }
          >
            {moreSourcesTooltip}
          </Tooltip>
        </div>
        <div className={styles.airbyte} aria-hidden="true">
          <svg
            className={styles.nowVerticalLogo}
            xmlns="http://www.w3.org/2000/svg"
            width="96"
            height="96"
            viewBox="0 0 32 32"
            fill="none"
          >
            <path
              d="M14.3694 4.00001C13.3343 3.99819 12.3183 4.28402 11.4309 4.82669C10.7285 5.25698 10.1239 5.83441 9.65724 6.52068L9.24459 7.24571L0 23.3115H6.67554L11.5408 14.8416L14.3727 9.91883L17.3045 4.83007C16.4184 4.28697 15.4037 4.00001 14.3694 4.00001Z"
              fill="url(#paint0_linear_39_1553)"
            />
            <path
              d="M19.4413 7.14407L19.1384 6.61894C18.6663 5.89061 18.0397 5.27933 17.3048 4.83008L14.373 9.93916L17.2017 14.8585L17.5145 15.4074L20.8423 9.60036L19.4413 7.14407Z"
              fill="url(#paint1_linear_39_1553)"
            />
            <path
              d="M17.6375 29C18.6717 29.0028 19.6868 28.7169 20.5726 28.1733C21.2768 27.7441 21.8827 27.1665 22.3496 26.4793L22.7623 25.7611L32.0002 9.67493H25.3247L20.4594 18.1449L17.6375 23.0609L14.6924 28.17C15.5807 28.7164 16.5996 29.0036 17.6375 29Z"
              fill="url(#paint2_linear_39_1553)"
            />
            <path
              d="M12.559 25.8559L12.8618 26.381C13.331 27.1107 13.9568 27.7223 14.6921 28.1699L17.6372 23.0608L14.8086 18.1414L14.4958 17.5959L11.168 23.3996L12.559 25.8559Z"
              fill="url(#paint3_linear_39_1553)"
            />
            <defs>
              <linearGradient
                id="paint0_linear_39_1553"
                x1="10.1646"
                y1="3.22077"
                x2="6.48868"
                y2="24.4324"
                gradientUnits="userSpaceOnUse"
              >
                <stop stop-color="#484CFE" />
                <stop offset="1" stop-color="#08D0FF" />
              </linearGradient>
              <linearGradient
                id="paint1_linear_39_1553"
                x1="17.2541"
                y1="15.2549"
                x2="21.1093"
                y2="-7.00075"
                gradientUnits="userSpaceOnUse"
              >
                <stop stop-color="#206DFE" />
                <stop offset="0.64" stop-color="#000051" />
              </linearGradient>
              <linearGradient
                id="paint2_linear_39_1553"
                x1="21.8368"
                y1="29.7793"
                x2="25.5094"
                y2="8.57136"
                gradientUnits="userSpaceOnUse"
              >
                <stop stop-color="#484CFE" />
                <stop offset="1" stop-color="#08D0FF" />
              </linearGradient>
              <linearGradient
                id="paint3_linear_39_1553"
                x1="13.5082"
                y1="19.046"
                x2="22.062"
                y2="34.1309"
                gradientUnits="userSpaceOnUse"
              >
                <stop stop-color="#206DFE" />
                <stop offset="0.64" stop-color="#000051" />
              </linearGradient>
            </defs>
          </svg>
          <AirbyteIllustration
            sourceHighlighted={highlightedSource}
            destinationHighlighted={highlightedDestination}
            className={styles.illustration}
          />
        </div>
        <div className={styles.destinations}>
          <Text bold as="div" className={styles.destinationsTitle}>
            <Tooltip
              control={
                <span>
                  <FormattedMessage id="connection.onboarding.destinations" /> <Icon type="question" size="sm" />
                </span>
              }
            >
              <FormattedMessage id="connection.onboarding.destinationsDescription" />
            </Tooltip>
          </Text>
          {destinations.map((destination, index) => {
            const tooltipText = formatMessage(
              { id: "connection.onboarding.addDestination" },
              { destination: destination?.name }
            );
            return (
              <ConnectionOnboardingConnectorLink
                key={destination?.destinationDefinitionId}
                testId={`onboardingDestination-${index}`}
                connector={destination}
                connectorType="destination"
                to={`${createDestinationBasePath}/${destination.destinationDefinitionId}`}
                tooltipText={tooltipText}
                onMouseEnter={() => setHighlightedDestination(index as HighlightIndex)}
              >
                <div className={styles.connectorIcon}>
                  <SvgIcon src={destination?.icon} />
                </div>
              </ConnectionOnboardingConnectorLink>
            );
          })}

          <ConnectionOnboardingConnectorLink
            testId="onboardingDestination-more"
            to={createDestinationBasePath}
            tooltipText={moreDestinationsTooltip}
            onMouseEnter={() => setHighlightedDestination(3)}
          >
            <Icon type="plus" className={styles.moreIcon} />
          </ConnectionOnboardingConnectorLink>
        </div>
      </div>
      <div className={styles.footer}>
        <Link
          to={createConnectionPath}
          data-testid="new-connection-button"
          className={classNames(
            styles.button,
            styles.typePrimary,
            styles.sizeL,
            styles.linkText,
            !canCreateConnection && styles.disabled
          )}
        >
          <FormattedMessage id="connection.onboarding.createFirst" />
        </Link>
      </div>
    </div>
  );
};
