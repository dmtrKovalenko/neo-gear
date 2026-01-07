import { useId, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import * as Slider from "@radix-ui/react-slider";
import type { GearParameterConfig, GearParameters } from "../types/gear.types";
import { InfoHoverCard } from "./InfoHoverCard";
import { PARAMETER_HELP_CONTENT } from "../types/help.content";

interface ParameterInputProps {
  config: GearParameterConfig;
  value: number | string;
  onChange: (key: string, value: number | string) => void;
}

export function ParameterInput({
  config: { key, label, min, max, step, unit, description, type, options },
  value,
  onChange,
}: ParameterInputProps) {
  const inputId = useId();
  const [inputValue, setInputValue] = useState(String(value));
  const lastExternalValue = useRef(value);

  const helpContent = PARAMETER_HELP_CONTENT[key as keyof GearParameters];

  useEffect(() => {
    if (value !== lastExternalValue.current) {
      setInputValue(String(value));
      lastExternalValue.current = value;
    }
  }, [value]);

  const handleSliderChange = (values: number[]) => {
    onChange(key, values[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setInputValue(rawValue);

    const newValue = parseFloat(rawValue);
    if (!isNaN(newValue)) {
      lastExternalValue.current = newValue;
      onChange(key, newValue);
    }
  };

  const handleInputBlur = () => {
    // On blur, if empty or invalid, reset to current valid value
    const parsedValue = parseFloat(inputValue);
    if (isNaN(parsedValue) || inputValue === "") {
      setInputValue(String(value));
    }
  };

  // Check if the current value is out of range
  const isOutOfRange =
    typeof value === "number" &&
    min !== undefined &&
    max !== undefined &&
    (value < min || value > max);

  const errorMessage = isOutOfRange
    ? `Value must be between ${min} and ${max}${unit ? ` ${unit}` : ""}`
    : null;

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(key, e.target.value);
  };

  if (type === "select" && options) {
    const labelElement = (
      <label
        htmlFor={inputId}
        className={`text-ink-primary font-mono text-sm font-semibold tracking-wide ${helpContent ? "flex cursor-help items-center gap-1.5" : ""}`}
      >
        {label}
        {helpContent && (
          <ion-icon
            name="help-circle-outline"
            class="text-ink-muted hover:text-primary-500 text-base transition-colors"
          ></ion-icon>
        )}
      </label>
    );

    return (
      <motion.div
        className="border-border border-b py-4 last:border-b-0"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-3 flex items-center justify-between">
          {helpContent ? (
            <InfoHoverCard content={helpContent}>{labelElement}</InfoHoverCard>
          ) : (
            labelElement
          )}
          <select
            id={inputId}
            className="focus:border-primary-500 focus:ring-primary-500/20 hover:border-primary-500 border-border bg-tertiary text-ink-primary min-w-50 cursor-pointer rounded border px-3 py-2 font-mono text-sm transition-all duration-200 focus:ring-2 focus:outline-none"
            value={value as string}
            onChange={handleSelectChange}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <p className="text-ink-muted text-xs leading-relaxed">{description}</p>
      </motion.div>
    );
  }

  if (typeof value !== "number") {
    return null;
  }

  return (
    <motion.div
      className="border-border border-b py-4 last:border-b-0"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-3 flex items-center justify-between">
        {(() => {
          const labelElement = (
            <label
              htmlFor={inputId}
              className={`text-ink-primary font-mono text-sm font-semibold tracking-wide ${helpContent ? "flex cursor-help items-center gap-1.5" : ""}`}
            >
              {label}
              {helpContent && (
                <ion-icon
                  name="help-circle-outline"
                  class="text-ink-muted hover:text-primary-500 text-base transition-colors"
                ></ion-icon>
              )}
            </label>
          );

          return helpContent ? (
            <InfoHoverCard content={helpContent}>{labelElement}</InfoHoverCard>
          ) : (
            labelElement
          );
        })()}
        <div className="flex items-center gap-1">
          <input
            type="number"
            id={inputId}
            className={`w-20 rounded border px-3 py-2 text-right font-mono text-sm transition-all duration-200 focus:ring-2 focus:outline-none ${
              errorMessage
                ? "border-red-500 bg-red-500/10 text-red-400 focus:border-red-500 focus:ring-red-500/20"
                : "focus:border-primary-500 focus:ring-primary-500/20 border-border bg-tertiary text-ink-primary"
            }`}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onClick={(e) => e.currentTarget.select()}
            onFocus={(e) => e.target.select()}
            step={step}
          />
          {unit && (
            <span className="text-ink-muted font-variant-numeric min-w-8 font-mono text-xs">
              {unit}
            </span>
          )}
        </div>
      </div>

      <div className="mb-2">
        <Slider.Root
          className="relative flex h-5 w-full touch-none items-center select-none"
          tabIndex={-1}
          value={[value]}
          onValueChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
          aria-label={label}
        >
          <Slider.Track className="bg-tertiary relative h-1.5 grow rounded-full">
            <Slider.Range className="bg-primary-500 absolute h-full rounded-full" />
          </Slider.Track>
          <Slider.Thumb
            className="border-primary bg-primary-500 block h-4 w-4 rounded-full border-2 shadow-lg transition-transform duration-150 hover:scale-110 focus:outline-none"
            tabIndex={-1}
          />
        </Slider.Root>
        <div className="text-ink-muted mt-1 flex justify-between font-mono text-[0.625rem]">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>

      {errorMessage ? (
        <p className="text-xs leading-relaxed text-red-400">{errorMessage}</p>
      ) : (
        <p className="text-ink-muted text-xs leading-relaxed">{description}</p>
      )}
    </motion.div>
  );
}
