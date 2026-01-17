import { useState, useCallback, useRef } from 'react';
import { generateReceipt, type ReceiptData } from '../utils/escpos';

interface PrinterState {
  isConnected: boolean;
  isConnecting: boolean;
  isPrinting: boolean;
  error: string | null;
}

export function usePrinter() {
  const [state, setState] = useState<PrinterState>({
    isConnected: false,
    isConnecting: false,
    isPrinting: false,
    error: null,
  });

  const portRef = useRef<SerialPort | null>(null);
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null);

  const isSupported = 'serial' in navigator;

  const connect = useCallback(async () => {
    if (!isSupported) {
      setState((s) => ({ ...s, error: 'Web Serial API not supported in this browser' }));
      return false;
    }

    setState((s) => ({ ...s, isConnecting: true, error: null }));

    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });

      portRef.current = port;

      if (port.writable) {
        writerRef.current = port.writable.getWriter();
      }

      setState({
        isConnected: true,
        isConnecting: false,
        isPrinting: false,
        error: null,
      });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect';
      setState({
        isConnected: false,
        isConnecting: false,
        isPrinting: false,
        error: message,
      });
      return false;
    }
  }, [isSupported]);

  const disconnect = useCallback(async () => {
    try {
      if (writerRef.current) {
        writerRef.current.releaseLock();
        writerRef.current = null;
      }

      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }

      setState({
        isConnected: false,
        isConnecting: false,
        isPrinting: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disconnect';
      setState((s) => ({ ...s, error: message }));
    }
  }, []);

  const print = useCallback(async (data: ReceiptData) => {
    if (!writerRef.current) {
      setState((s) => ({ ...s, error: 'Printer not connected' }));
      return false;
    }

    setState((s) => ({ ...s, isPrinting: true, error: null }));

    try {
      const receiptData = generateReceipt(data);
      await writerRef.current.write(receiptData);

      setState((s) => ({ ...s, isPrinting: false }));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to print';
      setState((s) => ({ ...s, isPrinting: false, error: message }));
      return false;
    }
  }, []);

  return {
    ...state,
    isSupported,
    connect,
    disconnect,
    print,
  };
}
