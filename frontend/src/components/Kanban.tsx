import { useMemo } from "react";
import type { PointerEvent } from "react";
import type { Application, Language, Stage, StageId } from "../types";
import { stageOrder } from "../data";
import StageColumn from "./StageColumn";

type KanbanProps = {
  lang: Language;
  stages: Stage[];
  applications: Application[];
  draggingId: number | null;
  onPointerDown: (id: number, event: PointerEvent<HTMLElement>) => void;
  canInteract: boolean;
  onMove: (id: number, direction: "left" | "right") => void;
  onOpen: (id: number) => void;
};

const Kanban = ({
  lang,
  stages,
  applications,
  draggingId,
  onPointerDown,
  canInteract,
  onMove,
  onOpen,
}: KanbanProps) => {
  const grouped = useMemo(() => {
    const map = new Map<StageId, Application[]>();
    stageOrder.forEach((stageId) => map.set(stageId, []));
    applications.forEach((app) => {
      const bucket = map.get(app.stage);
      if (bucket) {
        bucket.push(app);
      }
    });
    return map;
  }, [applications]);

  const canMove = (stageId: StageId, direction: "left" | "right") => {
    const index = stageOrder.indexOf(stageId);
    if (direction === "left") {
      return index > 0;
    }
    return index < stageOrder.length - 1;
  };

  return (
    <section className="kanban">
      {stages.map((stage) => (
        <StageColumn
          key={stage.id}
          lang={lang}
          stage={stage}
          applications={grouped.get(stage.id) ?? []}
          draggingId={draggingId}
          onPointerDown={onPointerDown}
          canInteract={canInteract}
          onMove={onMove}
          canMove={canMove}
          onOpen={onOpen}
        />
      ))}
      {draggingId ? <div className="drag-indicator" /> : null}
    </section>
  );
};

export default Kanban;
