import type { HelpContent } from "../components/InfoHoverCard";
import type { GearParameters } from "./gear.types";

/**
 * Help content for gear parameters.
 * Add entries here to show a help icon with hover card for any parameter.
 *
 * Each entry accepts JSX content for full formatting flexibility.
 */
export const PARAMETER_HELP_CONTENT: Partial<
  Record<keyof GearParameters, HelpContent>
> = {
  module: {
    title: "What is a module?",
    content: (
      <>
        <p>
          Module is the main paramter for the gear because it controls the ratio
          of a size to the number of teeth. Think of module like the "size
          setting" for the gears of different diamaters. If 2 gears have the same
          module, they will mesh together properly.
        </p>

        <p className="text-ink-primary font-semibold">How to measure my gear</p>
        <p>
          Count all the teeth on your gear, then measure across the widest part
          (the diameter at the tooth tips) in millimeters. Use this formula:{" "}
          <pre className="text-ink-primary rounded py-1.5">
            Module = Diameter / (Teeth + 2)
          </pre>
          For example, if your gear has 20 teeth and is 44mm across:{" "}
          <span className="text-ink-primary">44 / (20 + 2) = 2mm module</span>.
          <br />
          <br />
          P.S. If you are extra anxious about 2mm constant use{" "}
          <a
            className="text-primary-500 font-medium underline"
            href="https://khkgears.net/new/gear_knowledge/abcs_of_gears-b/basic_gear_terminology_calculation.html"
          >
            pitch diamater based calculation.
          </a>
        </p>
      </>
    ),
  },

  // Add more parameter help content here:
  //
  // pressureAngle: {
  //   title: "What is Pressure Angle?",
  //   content: (
  //     <>
  //       <p>First paragraph explaining the concept simply...</p>
  //       <p>Second paragraph with practical details...</p>
  //     </>
  //   ),
  // },
};
