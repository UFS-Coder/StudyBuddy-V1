import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Upload, 
  Link as LinkIcon, 
  File, 
  ExternalLink, 
  Trash2, 
  Download,
  Paperclip
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type ResourceAttachment = Tables<'resource_attachments'>;

interface ResourceAttachmentsProps {
  topicId?: string;
  subtopicId?: string;
  userId: string;
}

export function ResourceAttachments({ topicId, subtopicId, userId }: ResourceAttachmentsProps) {
  const [resources, setResources] = useState<ResourceAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [newLink, setNewLink] = useState({ title: '', url: '', description: '' });
  const [isAddingLink, setIsAddingLink] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchResources();
  }, [topicId, subtopicId, userId]);

  const fetchResources = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('resource_attachments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (topicId) {
        query = query.eq('topic_id', topicId);
      }
      if (subtopicId) {
        query = query.eq('subtopic_id', subtopicId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: 'Error',
        description: 'Failed to load resources',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `resources/${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      // Save resource record
      const { data, error } = await supabase
        .from('resource_attachments')
        .insert({
          title: file.name,
          resource_type: 'file',
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_url: publicUrl,
          topic_id: topicId || null,
          subtopic_id: subtopicId || null,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;

      setResources([data, ...resources]);
      toast({
        title: 'Success',
        description: 'File uploaded successfully',
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const addLink = async () => {
    if (!newLink.title.trim() || !newLink.url.trim()) return;

    try {
      const { data, error } = await supabase
        .from('resource_attachments')
        .insert({
          title: newLink.title,
          resource_type: 'link',
          link_url: newLink.url,
          link_description: newLink.description || null,
          topic_id: topicId || null,
          subtopic_id: subtopicId || null,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;

      setResources([data, ...resources]);
      setNewLink({ title: '', url: '', description: '' });
      setIsAddingLink(false);
      toast({
        title: 'Success',
        description: 'Link added successfully',
      });
    } catch (error) {
      console.error('Error adding link:', error);
      toast({
        title: 'Error',
        description: 'Failed to add link',
        variant: 'destructive',
      });
    }
  };

  const deleteResource = async (id: string) => {
    try {
      const resource = resources.find(r => r.id === id);
      
      // Delete file from storage if it's a file resource
      if (resource?.resource_type === 'file' && resource.resource_url) {
        const filePath = resource.resource_url.split('/').slice(-3).join('/');
        await supabase.storage.from('attachments').remove([filePath]);
      }

      const { error } = await supabase
        .from('resource_attachments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setResources(resources.filter(r => r.id !== id));
      toast({
        title: 'Success',
        description: 'Resource deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete resource',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fileResources = resources.filter(r => r.resource_type === 'file');
  const linkResources = resources.filter(r => r.resource_type === 'link');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Resources
            {resources.length > 0 && (
              <Badge variant="outline">
                {resources.length}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="files" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="files" className="flex items-center gap-2">
              <File className="h-4 w-4" />
              Files ({fileResources.length})
            </TabsTrigger>
            <TabsTrigger value="links" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Links ({linkResources.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="space-y-4">
            <div className="flex gap-2">
              <label className="flex-1">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <Button 
                  className="w-full" 
                  variant="outline"
                  disabled={isUploading}
                  asChild
                >
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Upload File'}
                  </span>
                </Button>
              </label>
            </div>

            <div className="space-y-2">
              {fileResources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <File className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium">{resource.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {resource.mime_type && (
                          <Badge variant="secondary" className="text-xs">
                            {resource.mime_type.split('/')[1]?.toUpperCase()}
                          </Badge>
                        )}
                        {resource.file_size && (
                          <span>{formatFileSize(resource.file_size)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {resource.resource_url && (
                      <Button
                        onClick={() => window.open(resource.resource_url!, '_blank')}
                        size="sm"
                        variant="ghost"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      onClick={() => deleteResource(resource.id)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {fileResources.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No files uploaded yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="links" className="space-y-4">
            <Button
              onClick={() => setIsAddingLink(true)}
              variant="outline"
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Link
            </Button>

            {isAddingLink && (
              <div className="p-3 border rounded-lg bg-white space-y-3">
                <Input
                  placeholder="Link title"
                  value={newLink.title}
                  onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                />
                <Input
                  placeholder="URL"
                  type="url"
                  value={newLink.url}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={newLink.description}
                  onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button onClick={addLink} size="sm">
                    Add Link
                  </Button>
                  <Button
                    onClick={() => {
                      setIsAddingLink(false);
                      setNewLink({ title: '', url: '', description: '' });
                    }}
                    size="sm"
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {linkResources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <LinkIcon className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="font-medium">{resource.title}</h4>
                      {resource.description && (
                        <p className="text-sm text-gray-600">{resource.description}</p>
                      )}
                      {resource.resource_url && (
                        <p className="text-xs text-blue-600 truncate max-w-xs">
                          {resource.resource_url}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {resource.resource_url && (
                      <Button
                        onClick={() => window.open(resource.resource_url!, '_blank')}
                        size="sm"
                        variant="ghost"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      onClick={() => deleteResource(resource.id)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {linkResources.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <LinkIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No links added yet</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}