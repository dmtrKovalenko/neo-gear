import { useId } from "react";
import { motion } from "framer-motion";
import * as Slider from "@radix-ui/react-slider";
import type { GearParameterConfig } from "../types/gear.types";

interface ParameterInputProps {
  config: GearParameterConfig;
  value: number | string;
  onChange: (key: string, value: number | string) => void;
}

export function ParameterInput({
  config,
  value,
  onChange,
}: ParameterInputProps) {
  const inputId = useId();
  const { key, label, min, max, step, unit, description, type, options } =
    config;

  const handleSliderChange = (values: number[]) => {
    onChange(key, values[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue) && min !== undefined && max !== undefined) {
      onChange(key, Math.min(max, Math.max(min, newValue)));
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(key, e.target.value);
  };

  if (type === "select" && options) {
    return (
      <motion.div
        className="border-border border-b py-4 last:border-b-0"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-3 flex items-center justify-between">
          <label
            htmlFor={inputId}
            className="text-text-primary font-mono text-sm font-semibold tracking-wide"
          >
            {label}
          </label>
          <select
            id={inputId}
            className="focus:border-primary-500 focus:ring-primary-500/20 hover:border-primary-500 border-border bg-bg-tertiary text-text-primary min-w-[200px] cursor-pointer rounded border px-3 py-2 font-mono text-sm transition-all duration-200 focus:ring-2 focus:outline-none"
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
        <p className="text-text-muted text-xs leading-relaxed">{description}</p>
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
        <label
          htmlFor={inputId}
          className="text-text-primary font-mono text-sm font-semibold tracking-wide"
        >
          {label}
        </label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            id={inputId}
            className="focus:border-primary-500 focus:ring-primary-500/20 border-border bg-bg-tertiary text-text-primary w-20 rounded border px-3 py-2 text-right font-mono text-sm transition-all duration-200 focus:ring-2 focus:outline-none"
            value={value}
            onChange={handleInputChange}
            onClick={(e) => e.currentTarget.select()}
            onFocus={(e) => e.target.select()}
            min={min}
            max={max}
            step={step}
          />
          {unit && (
            <span className="text-text-muted font-variant-numeric min-w-8 font-mono text-xs">
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
          <Slider.Track className="bg-bg-tertiary relative h-1.5 grow rounded-full">
            <Slider.Range className="bg-primary-500 absolute h-full rounded-full" />
          </Slider.Track>
          <Slider.Thumb
            className="border-bg-primary bg-primary-500 block h-4 w-4 rounded-full border-2 shadow-lg transition-transform duration-150 hover:scale-110 focus:outline-none"
            tabIndex={-1}
          />
        </Slider.Root>
        <div className="text-text-muted mt-1 flex justify-between font-mono text-[0.625rem]">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>

      <p className="text-text-muted text-xs leading-relaxed">{description}</p>
    </motion.div>
  );
}
