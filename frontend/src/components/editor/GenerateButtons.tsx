type GenerateButtonsProps = {
  onGenerateNext: () => void;
  onGenerateAtCursor: () => void;
  onUndoLast: () => void;
  onModifySection: () => void;
  hasSelection: boolean;
  loading: boolean;
};

export default function GenerateButtons({
  onGenerateNext,
  onGenerateAtCursor,
  onUndoLast,
  onModifySection,
  hasSelection,
  loading,
}: GenerateButtonsProps) {
  const renderButtonContent = (text: string) =>
    loading ? (
      <div className="flex items-center justify-center space-x-1">
        <span className="animate-pulse">.</span>
        <span className="animate-pulse delay-150">.</span>
        <span className="animate-pulse delay-300">.</span>
      </div>
    ) : (
      text
    );

  return (
    <div className="p-4 flex gap-2">
      {hasSelection ? (
        <button
          className="generate-button flex-1 relative"
          onClick={onModifySection}
          disabled={loading}
        >
          {renderButtonContent("Modify Section")}
        </button>
      ) : (
        <>
          <button
            className="generate-button flex-1 relative"
            onClick={onGenerateNext}
            disabled={loading}
          >
            {renderButtonContent("Generate next line")}
          </button>

          <button
            className="generate-button flex-1 relative"
            onClick={onGenerateAtCursor}
            disabled={loading}
          >
            {renderButtonContent("Generate at cursor")}
          </button>
        </>
      )}

      <button
        className="hacker-button w-26 relative"
        onClick={onUndoLast}
        disabled={loading}
        title="Undo AI output"
      >
        {renderButtonContent("Undo ⟲")}
      </button>
    </div>
  );
}
