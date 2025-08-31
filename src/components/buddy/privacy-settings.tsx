import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Shield, Eye, EyeOff, Trash2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PrivacySettings {
  shareContext: boolean;
  shareGrades: boolean;
  sharePersonalInfo: boolean;
  dataRetentionDays: number;
  allowAnalytics: boolean;
}

interface PrivacySettingsProps {
  onSettingsChange?: (settings: PrivacySettings) => void;
}

export const PrivacySettingsComponent: React.FC<PrivacySettingsProps> = ({
  onSettingsChange
}) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<PrivacySettings>({
    shareContext: true,
    shareGrades: false,
    sharePersonalInfo: false,
    dataRetentionDays: 30,
    allowAnalytics: false
  });
  const [showDataDialog, setShowDataDialog] = useState(false);
  const [exportData, setExportData] = useState('');

  const handleSettingChange = (key: keyof PrivacySettings, value: boolean | number) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
    
    // Save to localStorage
    localStorage.setItem('buddy-privacy-settings', JSON.stringify(newSettings));
    
    toast({
      title: 'Datenschutzeinstellungen aktualisiert',
      description: 'Ihre Einstellungen wurden gespeichert.',
    });
  };

  const handleExportData = async () => {
    try {
      // Collect user data from various sources
      const chatHistory = localStorage.getItem('buddy-chat-history') || '[]';
      const privacySettings = localStorage.getItem('buddy-privacy-settings') || '{}';
      const contextData = localStorage.getItem('buddy-context-data') || '{}';
      
      const exportData = {
        timestamp: new Date().toISOString(),
        chatHistory: JSON.parse(chatHistory),
        privacySettings: JSON.parse(privacySettings),
        contextData: JSON.parse(contextData),
        version: '1.0'
      };
      
      setExportData(JSON.stringify(exportData, null, 2));
      setShowDataDialog(true);
    } catch (error) {
      toast({
        title: 'Fehler beim Exportieren',
        description: 'Daten konnten nicht exportiert werden.',
        variant: 'destructive'
      });
    }
  };

  const handleDownloadData = () => {
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buddy-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Daten heruntergeladen',
      description: 'Ihre Daten wurden erfolgreich heruntergeladen.',
    });
  };

  const handleDeleteAllData = () => {
    // Clear all Buddy-related data
    localStorage.removeItem('buddy-chat-history');
    localStorage.removeItem('buddy-privacy-settings');
    localStorage.removeItem('buddy-context-data');
    localStorage.removeItem('buddy-user-preferences');
    
    // Reset settings to defaults
    const defaultSettings: PrivacySettings = {
      shareContext: true,
      shareGrades: false,
      sharePersonalInfo: false,
      dataRetentionDays: 30,
      allowAnalytics: false
    };
    
    setSettings(defaultSettings);
    onSettingsChange?.(defaultSettings);
    
    toast({
      title: 'Alle Daten gelöscht',
      description: 'Alle Buddy-Daten wurden erfolgreich gelöscht.',
    });
  };

  React.useEffect(() => {
    // Load settings from localStorage on component mount
    const savedSettings = localStorage.getItem('buddy-privacy-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        onSettingsChange?.(parsed);
      } catch (error) {
        console.error('Failed to parse saved privacy settings:', error);
      }
    }
  }, [onSettingsChange]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Datenschutz & Sicherheit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Context Sharing */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Kontext teilen</Label>
              <p className="text-sm text-muted-foreground">
                Erlaubt Buddy, Informationen über die aktuelle Seite zu verwenden
              </p>
            </div>
            <Switch
              checked={settings.shareContext}
              onCheckedChange={(checked) => handleSettingChange('shareContext', checked)}
            />
          </div>

          {/* Grade Sharing */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Noten teilen</Label>
              <p className="text-sm text-muted-foreground">
                Erlaubt Buddy, auf Ihre Noten und Bewertungen zuzugreifen
              </p>
            </div>
            <Switch
              checked={settings.shareGrades}
              onCheckedChange={(checked) => handleSettingChange('shareGrades', checked)}
            />
          </div>

          {/* Personal Info Sharing */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Persönliche Informationen</Label>
              <p className="text-sm text-muted-foreground">
                Erlaubt Buddy, persönliche Daten wie Namen und E-Mail zu verwenden
              </p>
            </div>
            <Switch
              checked={settings.sharePersonalInfo}
              onCheckedChange={(checked) => handleSettingChange('sharePersonalInfo', checked)}
            />
          </div>

          {/* Analytics */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Nutzungsanalyse</Label>
              <p className="text-sm text-muted-foreground">
                Hilft bei der Verbesserung von Buddy durch anonyme Nutzungsdaten
              </p>
            </div>
            <Switch
              checked={settings.allowAnalytics}
              onCheckedChange={(checked) => handleSettingChange('allowAnalytics', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Datenverwaltung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Dialog open={showDataDialog} onOpenChange={setShowDataDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={handleExportData} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Daten exportieren
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Datenexport</DialogTitle>
                  <DialogDescription>
                    Hier sind alle Ihre gespeicherten Buddy-Daten. Sie können diese herunterladen oder kopieren.
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-96 overflow-auto">
                  <Textarea
                    value={exportData}
                    readOnly
                    className="min-h-64 font-mono text-xs"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDataDialog(false)}>
                    Schließen
                  </Button>
                  <Button onClick={handleDownloadData}>
                    Herunterladen
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Alle Daten löschen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Alle Daten löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Diese Aktion kann nicht rückgängig gemacht werden. Alle Ihre Chat-Verläufe, 
                    Einstellungen und gespeicherten Daten werden dauerhaft gelöscht.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAllData} className="bg-destructive text-destructive-foreground">
                    Alle Daten löschen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Hinweis:</strong> Ihre Daten werden lokal in Ihrem Browser gespeichert. 
              Chat-Verläufe werden automatisch nach {settings.dataRetentionDays} Tagen gelöscht.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacySettingsComponent;