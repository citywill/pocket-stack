import {
    FlowIcon,
    LegalDocument01Icon,
    Search01Icon,
} from "@hugeicons/core-free-icons";

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
    mindmap: FlowIcon,
    text: LegalDocument01Icon,
    table: Search01Icon,
};
