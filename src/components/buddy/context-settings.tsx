import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Eye, EyeOff, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLocation } from 'react-router-dom';

interface ContextSettings {
  shareCurrentPage: boolean;
  shareGrades: boolean;
  shareSubjects: boolean;
  shareHomework: boolean;
  shareProfile: boolean;
  shareNavigation: boolean;
  shareFormData: boolean;
}

interface ContextSettingsProps {
  onSettingsChange?: (settings: ContextSettings) => void;
}

const defaultSettings: ContextSettings = {
  shareCurrentPage: true,
  shareGrades: false,
  shareSubjects: true,
  shareHomework: true,
  shareProfile: false,
  shareNavigation: true,
  shareFormData: false
};

export function ContextSettingsComponent({ onSettingsChange }: ContextSettingsProps) {
  const [settings, setSettings] = useState<ContextSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const location = useLocation();

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('buddy-context-settings');
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsedSettings });
      }
    } catch (error) {
      console.error('Failed to load context settings:', error);
    }
  }, []);

  // Save settings to localStorage and notify parent
  const saveSettings = () => {
    try {
      localStorage.setItem('buddy-context-settings', JSON.stringify(settings));
      setHasChanges(false);
      onSettingsChange?.(settings);
    } catch (error) {
      console.error('Failed to save context settings:', error);
    }
  };

  const updateSetting = (key: keyof ContextSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  // Get current page context info
  const getCurrentPageInfo = () => {
    const path = location.pathname;
    if (path.includes('/subjects')) return { name: 'Fächer', sensitive: false };
    if (path.includes('/grades')) return { name: 'Noten', sensitive: true };
    if (path.includes('/homework')) return { name: 'Hausaufgaben', sensitive: false };
    if (path.includes('/profile')) return { name: 'Profil', sensitive: true };
    if (path.includes('/settings')) return { name: 'Einstellungen', sensitive: true };
    return { name: 'Startseite', sensitive: false };
  };

  const currentPage = getCurrentPageInfo();
  const sensitiveDataShared = settings.shareGrades || settings.shareProfile || settings.shareFormData;

  return (
    <div className="space-y-6">
      {/* Current Context Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Aktueller Kontext
          </CardTitle>
          <CardDescription>
            Informationen über die aktuelle Seite und was Buddy sehen kann
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Aktuelle Seite</Label>
              <p className="text-sm text-muted-foreground">{currentPage.name}</p>
            </div>
            <Badge variant={currentPage.sensitive ? "destructive" : "secondary"}>
              {currentPage.sensitive ? "Sensible Daten" : "Öffentlich"}
            </Badge>
          </div>
          
          {sensitiveDataShared && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Sie teilen derzeit sensible Daten mit Buddy. Überprüfen Sie Ihre Einstellungen unten.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Context Sharing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Kontext-Freigabe Einstellungen
          </CardTitle>
          <CardDescription>
            Kontrollieren Sie, welche Informationen Buddy zur Verfügung stehen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Context */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Grundlegende Informationen</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="share-page">Aktuelle Seite teilen</Label>
                <p className="text-xs text-muted-foreground">
                  Buddy weiß, auf welcher Seite Sie sich befinden
                </p>
              </div>
              <Switch
                id="share-page"
                checked={settings.shareCurrentPage}
                onCheckedChange={(checked) => updateSetting('shareCurrentPage', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="share-navigation">Navigation teilen</Label>
                <p className="text-xs text-muted-foreground">
                  Buddy kann Ihnen bei der Navigation helfen
                </p>
              </div>
              <Switch
                id="share-navigation"
                checked={settings.shareNavigation}
                onCheckedChange={(checked) => updateSetting('shareNavigation', checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Academic Data */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Akademische Daten</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="share-subjects">Fächer teilen</Label>
                <p className="text-xs text-muted-foreground">
                  Buddy kann fachspezifische Hilfe anbieten
                </p>
              </div>
              <Switch
                id="share-subjects"
                checked={settings.shareSubjects}
                onCheckedChange={(checked) => updateSetting('shareSubjects', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="share-homework">Hausaufgaben teilen</Label>
                <p className="text-xs text-muted-foreground">
                  Buddy kann bei Hausaufgaben helfen
                </p>
              </div>
              <Switch
                id="share-homework"
                checked={settings.shareHomework}
                onCheckedChange={(checked) => updateSetting('shareHomework', checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Sensitive Data */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-destructive">Sensible Daten</h4>
              <Badge variant="destructive" className="text-xs">Vorsicht</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="share-grades" className="text-destructive">Noten teilen</Label>
                <p className="text-xs text-muted-foreground">
                  Buddy kann Notentrends analysieren (nicht empfohlen)
                </p>
              </div>
              <Switch
                id="share-grades"
                checked={settings.shareGrades}
                onCheckedChange={(checked) => updateSetting('shareGrades', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="share-profile" className="text-destructive">Profildaten teilen</Label>
                <p className="text-xs text-muted-foreground">
                  Name, E-Mail und persönliche Informationen (nicht empfohlen)
                </p>
              </div>
              <Switch
                id="share-profile"
                checked={settings.shareProfile}
                onCheckedChange={(checked) => updateSetting('shareProfile', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="share-form-data" className="text-destructive">Formulardaten teilen</Label>
                <p className="text-xs text-muted-foreground">
                  Eingaben in Formularen (nicht empfohlen)
                </p>
              </div>
              <Switch
                id="share-form-data"
                checked={settings.shareFormData}
                onCheckedChange={(checked) => updateSetting('shareFormData', checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <Button variant="outline" onClick={resetToDefaults}>
              Standardeinstellungen
            </Button>
            
            <Button 
              onClick={saveSettings} 
              disabled={!hasChanges}
              className="min-w-[100px]"
            >
              {hasChanges ? 'Speichern' : 'Gespeichert'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Datenschutz-Hinweis</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Alle geteilten Informationen werden nur für die aktuelle Unterhaltung verwendet und nicht dauerhaft gespeichert. 
                Sensible Daten wie persönliche Informationen werden automatisch erkannt und maskiert. 
                Sie können diese Einstellungen jederzeit ändern.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Export function to get current context settings
export function getContextSettings(): ContextSettings {
  try {
    const saved = localStorage.getItem('buddy-context-settings');
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Failed to load context settings:', error);
  }
  return defaultSettings;
}

// Export function to check if specific data type should be shared
export function shouldShareContext(type: keyof ContextSettings): boolean {
  const settings = getContextSettings();
  return settings[type];
}

export default ContextSettingsComponent;