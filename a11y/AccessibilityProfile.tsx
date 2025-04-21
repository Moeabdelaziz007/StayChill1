import React, { useState, useEffect } from 'react';
import { useA11y } from './A11yProvider';
import { useTranslation } from '@/lib/i18n';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  Save, 
  Trash2, 
  PlusCircle, 
  Download, 
  List 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  name: string;
  timestamp: number;
}

/**
 * مكون إدارة ملفات تعريف الوصولية
 * 
 * يتيح للمستخدمين إنشاء وحفظ وتحميل وحذف ملفات تعريف مخصصة للوصولية
 */
const AccessibilityProfile: React.FC = () => {
  const { 
    saveProfile, 
    loadProfile, 
    deleteProfile, 
    resetAll 
  } = useA11y();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // حالة المكون
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [newProfileName, setNewProfileName] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // تحميل ملفات التعريف المتاحة عند تحميل المكون
  useEffect(() => {
    loadProfiles();
  }, []);
  
  // تحميل ملفات التعريف المحفوظة من التخزين المحلي
  const loadProfiles = () => {
    try {
      const savedProfiles = localStorage.getItem('a11y-profiles');
      if (savedProfiles) {
        const profileData = JSON.parse(savedProfiles);
        
        // تحويل بيانات ملفات التعريف إلى مصفوفة لعرضها
        const profilesArray = Object.keys(profileData).map(name => ({
          name,
          timestamp: profileData[name].timestamp || Date.now()
        }));
        
        // ترتيب ملفات التعريف حسب الاسم
        profilesArray.sort((a, b) => a.name.localeCompare(b.name));
        
        setProfiles(profilesArray);
      }
    } catch (error) {
      console.error('Error loading accessibility profiles:', error);
    }
  };
  
  // حفظ ملف تعريف جديد
  const handleSaveProfile = () => {
    if (!newProfileName || newProfileName.trim() === '') {
      toast({
        title: t('accessibility.profileNameRequired'),
        description: t('accessibility.pleaseEnterProfileName'),
        variant: 'destructive'
      });
      return;
    }
    
    try {
      // حفظ ملف التعريف باستخدام A11yProvider
      saveProfile(newProfileName);
      
      // تحديث القائمة وإعادة تعيين حقل الإدخال
      loadProfiles();
      setNewProfileName('');
      
      toast({
        title: t('accessibility.profileSaved'),
        description: t('accessibility.profileSavedDescription', { name: newProfileName }),
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: t('accessibility.errorSavingProfile'),
        description: t('accessibility.tryAgain'),
        variant: 'destructive'
      });
    }
  };
  
  // تحميل ملف تعريف محدد
  const handleLoadProfile = () => {
    if (!selectedProfile) {
      toast({
        title: t('accessibility.noProfileSelected'),
        description: t('accessibility.pleaseSelectProfile'),
        variant: 'destructive'
      });
      return;
    }
    
    try {
      // تحميل ملف التعريف المحدد باستخدام A11yProvider
      loadProfile(selectedProfile);
      
      toast({
        title: t('accessibility.profileLoaded'),
        description: t('accessibility.profileLoadedDescription', { name: selectedProfile }),
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: t('accessibility.errorLoadingProfile'),
        description: t('accessibility.tryAgain'),
        variant: 'destructive'
      });
    }
  };
  
  // حذف ملف تعريف محدد
  const handleDeleteProfile = () => {
    if (!selectedProfile) {
      return;
    }
    
    try {
      // حذف ملف التعريف المحدد باستخدام A11yProvider
      deleteProfile(selectedProfile);
      
      // تحديث القائمة وإعادة تعيين الملف المحدد
      loadProfiles();
      setSelectedProfile(null);
      setIsDeleteDialogOpen(false);
      
      toast({
        title: t('accessibility.profileDeleted'),
        description: t('accessibility.profileDeletedDescription', { name: selectedProfile }),
      });
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast({
        title: t('accessibility.errorDeletingProfile'),
        description: t('accessibility.tryAgain'),
        variant: 'destructive'
      });
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('accessibility.profiles')}</CardTitle>
        <CardDescription>
          {t('accessibility.profilesDescription')}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* إنشاء ملف تعريف جديد */}
        <div className="space-y-2">
          <Label htmlFor="new-profile-name">{t('accessibility.createNewProfile')}</Label>
          <div className="flex gap-2">
            <Input
              id="new-profile-name"
              placeholder={t('accessibility.profileNamePlaceholder')}
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
            />
            <Button onClick={handleSaveProfile}>
              <Save className="h-4 w-4 mr-2" />
              {t('accessibility.save')}
            </Button>
          </div>
        </div>
        
        {/* تحميل ملف تعريف موجود */}
        <div className="space-y-2">
          <Label htmlFor="load-profile">{t('accessibility.loadProfile')}</Label>
          <div className="flex gap-2">
            <Select 
              value={selectedProfile || ''} 
              onValueChange={setSelectedProfile}
            >
              <SelectTrigger id="load-profile" className="flex-grow">
                <SelectValue placeholder={t('accessibility.selectProfile')} />
              </SelectTrigger>
              <SelectContent>
                {profiles.length > 0 ? (
                  profiles.map(profile => (
                    <SelectItem key={profile.name} value={profile.name}>
                      {profile.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-profiles" disabled>
                    {t('accessibility.noProfilesFound')}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={handleLoadProfile}
              disabled={!selectedProfile}
            >
              <Download className="h-4 w-4 mr-2" />
              {t('accessibility.load')}
            </Button>
            
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  disabled={!selectedProfile}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('accessibility.confirmDelete')}</DialogTitle>
                  <DialogDescription>
                    {t('accessibility.confirmDeleteDescription', { name: selectedProfile || '' })}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">{t('accessibility.cancel')}</Button>
                  </DialogClose>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteProfile}
                  >
                    {t('accessibility.delete')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* قائمة ملفات التعريف */}
        {profiles.length > 0 && (
          <div>
            <Label>{t('accessibility.savedProfiles')}</Label>
            <div className="mt-2 border rounded-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <List className="h-4 w-4" />
                <span className="font-medium">{t('accessibility.profilesList')}</span>
              </div>
              <div className="space-y-1">
                {profiles.map(profile => (
                  <div 
                    key={profile.name}
                    className="px-2 py-1 rounded hover:bg-muted flex justify-between"
                  >
                    <span>{profile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(profile.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={resetAll}
        >
          {t('accessibility.resetAllSettings')}
        </Button>
        
        {profiles.length === 0 && (
          <div className="text-sm text-muted-foreground italic">
            {t('accessibility.noSavedProfiles')}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default AccessibilityProfile;