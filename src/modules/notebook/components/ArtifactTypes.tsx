import {
    ShareIcon,
    DocumentTextIcon,
    TableCellsIcon,
} from "@heroicons/react/24/outline";

export interface NotebookBuilder {
    id: string;
    title: string;
    prompt: string;
    type: 'mindmap' | 'text' | 'table';
}

export interface ArtifactItem {
    id: string;
    title: string;
    type: string;
    content: string;
    notebook: string;
    builder: string;
    created: string;
    isGenerating?: boolean;
}

export const typeIconMap: Record<string, any> = {
    mindmap: ShareIcon,
    text: DocumentTextIcon,
    table: TableCellsIcon,
};
