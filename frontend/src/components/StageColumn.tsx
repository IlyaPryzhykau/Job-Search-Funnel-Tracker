import type { PointerEvent } from "react";
import type { Application, Language, Stage } from "../types";
import Card from "./Card";

type StageColumnProps = {
  lang: Language;
  stage: Stage;
  applications: Application[];
  draggingId: number | null;
  onPointerDown: (id: number, event: PointerEvent<HTMLElement>) => void;
  canInteract: boolean;
  stages: Stage[];
  onMoveToStage: (id: number, stageId: Stage["id"]) => void;
  onOpen: (id: number) => void;
};

const StageColumn = ({
  lang,
  stage,
  applications,
  draggingId,
  onPointerDown,
  canInteract,
  stages,
  onMoveToStage,
  onOpen,
}: StageColumnProps) => {
  return (
    <section className="column" data-stage-id={stage.id}>
      <header>
        <div>
          <h3>{stage.title}</h3>
          <span>{applications.length}</span>
        </div>
      </header>
      <div className="column__cards">
        {applications.map((application) => (
          <Card
            key={application.id}
            lang={lang}
            application={application}
            isDragging={draggingId === application.id}
            isDisabled={!canInteract}
            stages={stages}
            onMoveToStage={onMoveToStage}
            onPointerDown={onPointerDown}
            onOpen={onOpen}
          />
        ))}
      </div>
    </section>
  );
};

export default StageColumn;
