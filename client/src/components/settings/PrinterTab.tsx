import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Printer, 
  Usb, 
  Bluetooth, 
  Wifi, 
  Settings, 
  TestTube, 
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

interface PrinterDevice {
  id: string;
  name: string;
  type: 'cable' | 'bluetooth' | 'network';
  status: 'connected' | 'disconnected' | 'error';
  address?: string;
  model?: string;
}

interface PrinterSettings {
  defaultPrinter: string;
  paperWidth: number;
  fontSize: number;
  enableLogo: boolean;
  enableCutter: boolean;
  enableBeep: boolean;
  copies: number;
}

export default function PrinterTab() {
  const [printers, setPrinters] = useState<PrinterDevice[]>([
    {
      id: 'cable-1',
      name: 'Thermal Printer USB',
      type: 'cable',
      status: 'disconnected',
      model: 'Epson TM-T20III'
    },
    {
      id: 'bluetooth-1', 
      name: 'Mobile Printer BT',
      type: 'bluetooth',
      status: 'disconnected',
      address: '00:11:22:33:44:55',
      model: 'Star mPOP'
    }
  ]);

  const [settings, setSettings] = useState<PrinterSettings>({
    defaultPrinter: '',
    paperWidth: 80,
    fontSize: 12,
    enableLogo: true,
    enableCutter: true,
    enableBeep: true,
    copies: 1
  });

  const [isScanning, setIsScanning] = useState(false);
  const [testPrinting, setTestPrinting] = useState(false);
  const { toast } = useToast();

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('printerSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('printerSettings', JSON.stringify(settings));
    toast({
      title: "Settings saved",
      description: "Printer settings have been saved successfully",
    });
  };

  const scanForPrinters = async () => {
    setIsScanning(true);
    
    // Simulate scanning for printers
    setTimeout(() => {
      const newBluetoothPrinter = {
        id: 'bluetooth-2',
        name: 'POS Printer BT',
        type: 'bluetooth' as const,
        status: 'disconnected' as const,
        address: '00:AA:BB:CC:DD:EE',
        model: 'Citizen CT-E351'
      };

      setPrinters(prev => {
        const exists = prev.find(p => p.id === newBluetoothPrinter.id);
        if (!exists) {
          return [...prev, newBluetoothPrinter];
        }
        return prev;
      });

      setIsScanning(false);
      toast({
        title: "Scan complete",
        description: "Found 1 new bluetooth printer",
      });
    }, 2000);
  };

  const connectPrinter = async (printerId: string) => {
    setPrinters(prev => prev.map(p => 
      p.id === printerId 
        ? { ...p, status: 'connected' as const } 
        : p
    ));

    toast({
      title: "Printer connected",
      description: "Successfully connected to printer",
    });
  };

  const disconnectPrinter = async (printerId: string) => {
    setPrinters(prev => prev.map(p => 
      p.id === printerId 
        ? { ...p, status: 'disconnected' as const } 
        : p
    ));

    toast({
      title: "Printer disconnected",
      description: "Successfully disconnected from printer",
    });
  };

  const testPrint = async () => {
    const connectedPrinter = printers.find(p => p.status === 'connected');
    if (!connectedPrinter) {
      toast({
        title: "No printer connected",
        description: "Please connect a printer first",
        variant: "destructive",
      });
      return;
    }

    setTestPrinting(true);
    
    // Simulate test printing
    setTimeout(() => {
      setTestPrinting(false);
      toast({
        title: "Test print sent",
        description: `Test receipt sent to ${connectedPrinter.name}`,
      });
    }, 1500);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Connected</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Error</Badge>;
      default:
        return <Badge variant="secondary">Disconnected</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cable':
        return <Usb className="w-4 h-4" />;
      case 'bluetooth':
        return <Bluetooth className="w-4 h-4" />;
      case 'network':
        return <Wifi className="w-4 h-4" />;
      default:
        return <Printer className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Printer Settings</h2>
        <div className="flex gap-2">
          <Button onClick={testPrint} disabled={testPrinting} data-testid="test-print-button">
            {testPrinting ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <TestTube className="w-4 h-4 mr-2" />
            )}
            Test Print
          </Button>
          <Button onClick={scanForPrinters} disabled={isScanning} data-testid="scan-printers-button">
            {isScanning ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Scan for Printers
          </Button>
        </div>
      </div>

      {/* Available Printers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Available Printers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {printers.map((printer) => (
              <div key={printer.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(printer.type)}
                    {getStatusIcon(printer.status)}
                  </div>
                  <div>
                    <h3 className="font-medium">{printer.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{printer.model}</span>
                      {printer.address && <span>• {printer.address}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(printer.status)}
                  {printer.status === 'connected' ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => disconnectPrinter(printer.id)}
                      data-testid={`disconnect-printer-${printer.id}`}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      onClick={() => connectPrinter(printer.id)}
                      data-testid={`connect-printer-${printer.id}`}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {printers.length === 0 && (
              <div className="text-center py-8">
                <Printer className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No printers found</h3>
                <p className="text-muted-foreground mb-4">
                  Click "Scan for Printers" to discover available devices
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Printer Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Printer Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Printer</label>
              <Select 
                value={settings.defaultPrinter} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, defaultPrinter: value }))}
              >
                <SelectTrigger data-testid="select-default-printer">
                  <SelectValue placeholder="Select default printer" />
                </SelectTrigger>
                <SelectContent>
                  {printers.filter(p => p.status === 'connected').map(printer => (
                    <SelectItem key={printer.id} value={printer.id}>
                      {printer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Paper Width (mm)</label>
              <Select 
                value={settings.paperWidth.toString()} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, paperWidth: parseInt(value) }))}
              >
                <SelectTrigger data-testid="select-paper-width">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="58">58mm</SelectItem>
                  <SelectItem value="80">80mm</SelectItem>
                  <SelectItem value="110">110mm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Font Size</label>
              <Input
                type="number"
                min="8"
                max="20"
                value={settings.fontSize}
                onChange={(e) => setSettings(prev => ({ ...prev, fontSize: parseInt(e.target.value) || 12 }))}
                data-testid="input-font-size"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Number of Copies</label>
              <Input
                type="number"
                min="1"
                max="5"
                value={settings.copies}
                onChange={(e) => setSettings(prev => ({ ...prev, copies: parseInt(e.target.value) || 1 }))}
                data-testid="input-copies"
              />
            </div>
          </div>

          {/* Print Options */}
          <div className="space-y-4">
            <h3 className="font-medium">Print Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <p className="text-sm font-medium">Print Logo</p>
                  <p className="text-xs text-muted-foreground">Include business logo on receipts</p>
                </div>
                <Switch
                  checked={settings.enableLogo}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableLogo: checked }))}
                  data-testid="switch-enable-logo"
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <p className="text-sm font-medium">Auto Cut</p>
                  <p className="text-xs text-muted-foreground">Automatically cut paper after printing</p>
                </div>
                <Switch
                  checked={settings.enableCutter}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableCutter: checked }))}
                  data-testid="switch-enable-cutter"
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <p className="text-sm font-medium">Beep Sound</p>
                  <p className="text-xs text-muted-foreground">Play sound when printing completes</p>
                </div>
                <Switch
                  checked={settings.enableBeep}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableBeep: checked }))}
                  data-testid="switch-enable-beep"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveSettings} data-testid="save-printer-settings">
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}