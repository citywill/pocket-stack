import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { useSearchParams } from 'react-router-dom';

interface NoteHeatmapProps {
    heatmapData: { date: string; count: number }[];
}

export function NoteHeatmap({ heatmapData }: NoteHeatmapProps) {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeFrom = searchParams.get('from');

    // 获取过去 30 天的日期范围
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 70);

    const handleSquareClick = (value: any) => {
        if (!value || !value.date) {
            searchParams.delete('from');
            searchParams.delete('to');
        } else {
            const dateStr = value.date; // 格式已经是 YYYY-MM-DD

            if (activeFrom === dateStr) {
                searchParams.delete('from');
                searchParams.delete('to');
            } else {
                searchParams.set('from', dateStr);
                searchParams.set('to', dateStr);
            }
        }
        // 清理旧的 date 参数（如果有）
        searchParams.delete('date');
        setSearchParams(searchParams);
    };

    return (
        <div className="backdrop-blur-sm rounded-2xl">
            <div className="heatmap-container">
                <CalendarHeatmap
                    startDate={thirtyDaysAgo}
                    endDate={today}
                    values={heatmapData}
                    gutterSize={3}
                    onClick={handleSquareClick}
                    classForValue={(value) => {
                        let className = 'color-empty';
                        if (value && value.count > 0) {
                            if (value.count === 1) className = 'color-scale-1';
                            else if (value.count === 2) className = 'color-scale-2';
                            else if (value.count === 3) className = 'color-scale-3';
                            else className = 'color-scale-4';
                        }

                        if (value && value.date === activeFrom) {
                            className += ' active-square';
                        }
                        return className;
                    }}
                    tooltipDataAttrs={(value: any) => {
                        if (!value || !value.date) return { 'data-tooltip-id': 'heatmap-tooltip', 'data-tooltip-content': '无记录' };
                        return {
                            'data-tooltip-id': 'heatmap-tooltip',
                            'data-tooltip-content': `${value.date}: ${value.count} 条记录`,
                        };
                    }}
                    showWeekdayLabels={false}
                    showMonthLabels={false}
                />
                <Tooltip id="heatmap-tooltip" />
            </div>

            <style>{`
        .heatmap-container .react-calendar-heatmap rect {
          rx: 2px;
          ry: 2px;
        }
        .heatmap-container .react-calendar-heatmap .color-empty { fill: #ebedf0; }
        .heatmap-container .react-calendar-heatmap .color-scale-1 { fill: #dbeafe; } /* blue-100 */
        .heatmap-container .react-calendar-heatmap .color-scale-2 { fill: #93c5fd; } /* blue-300 */
        .heatmap-container .react-calendar-heatmap .color-scale-3 { fill: #3b82f6; } /* blue-500 */
        .heatmap-container .react-calendar-heatmap .color-scale-4 { fill: #1d4ed8; } /* blue-700 */
        
        .heatmap-container .react-calendar-heatmap .active-square {
          stroke: #3b82f6;
          stroke-width: 2px;
          paint-order: stroke;
        }

        .heatmap-container .react-calendar-heatmap {
          height: auto;
          width: 100%;
        }
      `}</style>
        </div>
    );
}
