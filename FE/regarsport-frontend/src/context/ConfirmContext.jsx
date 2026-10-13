/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useState } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";

const ConfirmContext = createContext(null);

/**
 * const confirm = useConfirm();
 * if (!(await confirm({ title, message, confirmLabel, tone: "danger" }))) return;
 */
export const ConfirmProvider = ({ children }) => {
  const [request, setRequest] = useState(null); // { options, resolve }

  const confirm = useCallback(
    (options) => new Promise((resolve) => setRequest({ options, resolve })),
    []
  );

  const close = useCallback((result) => {
    setRequest((current) => {
      current?.resolve(result);
      return null;
    });
  }, []);

  const cancel = useCallback(() => close(false), [close]);
  const accept = useCallback(() => close(true), [close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog options={request?.options} onCancel={cancel} onConfirm={accept} />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => useContext(ConfirmContext);
