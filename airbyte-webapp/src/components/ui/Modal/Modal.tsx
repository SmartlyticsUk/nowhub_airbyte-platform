import { Dialog } from "@headlessui/react";
import classNames from "classnames";
import React, { useState } from "react";
import { useIntl } from "react-intl";

import styles from "./Modal.module.scss";
import { Box } from "../Box";
import { FlexContainer } from "../Flex";
import { Heading } from "../Heading";
import { Icon } from "../Icon";
import { Overlay } from "../Overlay";

export interface ModalProps {
  title?: string | React.ReactNode;
  /**
   * Function to call when the user clicks on the close button (cross icon).
   */
  onClose?: (reason: string) => void;
  /**
   * Function to call when the user clicks on overlay or press escape.
   * Note: if openModal function was called with "preventCancel: true" then this function will not be called.
   */
  onCancel?: () => void;
  cardless?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  testId?: string;
  /**
   * If specified, the full content of the modal including header, body and footer is wrapped in this component (only a class name prop might be set on the component)
   */
  wrapIn?: React.FC<React.PropsWithChildren<{ className?: string }>>;
}

const cardStyleBySize = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
  xl: styles.xl,
  full: styles.full,
};

export const Modal: React.FC<React.PropsWithChildren<ModalProps>> = ({
  children,
  title,
  size,
  onClose,
  onCancel,
  cardless,
  testId,
  wrapIn,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const { formatMessage } = useIntl();

  const onModalCancel = () => {
    if (onCancel) {
      setIsOpen(false);
      onCancel();
    }
  };

  const onModalClose = () => {
    setIsOpen(false);
    onClose?.("closeButtonClicked");
  };

  const Wrapper = wrapIn || "div";

  return (
    <Dialog open={isOpen} onClose={onModalCancel} data-testid={testId} className={styles.modalPageContainer}>
      <Overlay />
      <Wrapper
        className={classNames(styles.modalContainer, {
          [styles["modalContainer--noSidebarOffset"]]: size === "full",
        })}
      >
        <Dialog.Panel className={styles.modalPanel}>
          {cardless ? (
            children
          ) : (
            <div className={classNames(styles.card, size ? cardStyleBySize[size] : undefined)}>
              <div className={styles.card__header}>
                <FlexContainer alignItems="stretch" justifyContent="space-between">
                  <Box p="xl">
                    <Heading as="h2" size="sm">
                      {title}
                    </Heading>
                  </Box>
                  <button
                    className={styles.card__closeButton}
                    onClick={onModalClose}
                    aria-label={formatMessage({ id: "modal.closeButtonLabel" })}
                  >
                    <Icon type="cross" />
                  </button>
                </FlexContainer>
              </div>
              {children}
            </div>
          )}
        </Dialog.Panel>
      </Wrapper>
    </Dialog>
  );
};
