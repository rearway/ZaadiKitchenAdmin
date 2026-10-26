import { showPipelineAdvanceControl } from '../model/daily-ops.schema';

type PipelineAdvanceControlProps = {
  stage: string;
  canAdvance: boolean;
  advanceLabel: string | null | undefined;
  isPending: boolean;
  onAdvance: () => void;
};

export default function PipelineAdvanceControl({
  stage,
  canAdvance,
  advanceLabel,
  isPending,
  onAdvance,
}: PipelineAdvanceControlProps) {
  if (!showPipelineAdvanceControl(stage, canAdvance)) return null;

  return (
    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
      <button
        className="btn-primary"
        style={{ padding: '10px 20px', opacity: isPending ? 0.7 : 1 }}
        disabled={isPending}
        onClick={onAdvance}
      >
        {isPending ? 'Advancing…' : (advanceLabel ?? 'Advance →')}
      </button>
    </div>
  );
}
