import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import type { Note } from '../types';
import { format, parseISO } from 'date-fns';

export default function NoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchNote = async () => {
      setLoading(true);
      try {
        const result = await pb.collection('treenote_notes').getOne(id, {
          expand: 'category',
          requestKey: null,
        });
        setNote(result as unknown as Note);
      } catch (error) {
        console.error('Failed to fetch note:', error);
        toast.error('获取文章失败');
        navigate('/treenote/note');
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">文章不存在</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/treenote/note')}
          className="rounded-xl"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          返回列表
        </Button>
      </div>
      <Card>
        <CardContent className="p-8 py-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-4">{note.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {note.expand?.category?.name && (
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                  {note.expand.category.name}
                </span>
              )}
              <span>{format(parseISO(note.created), 'yyyy-MM-dd HH:mm')}</span>
            </div>
          </div>
          <div className="prose max-w-none">
            {note.content ? (
              <div className="whitespace-pre-wrap">{note.content}</div>
            ) : (
              <div className="text-gray-400 italic">暂无内容</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}