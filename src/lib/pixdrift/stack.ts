/**
 * The PIXDRIFT stack (engineering doctrine §16) — the recurring six-function
 * model most PIXDRIFT products combine. Structured so it renders consistently
 * wherever the model appears.
 *
 *   CONNECT → COLLECT → NORMALIZE → AUTOMATE → VERIFY → INFORM
 */

export interface StackFunction {
  no: string;
  name: string;
  description: string;
}

export const pixdriftStack: StackFunction[] = [
  { no: "01", name: "Connect", description: "Connect existing systems and information sources." },
  { no: "02", name: "Collect", description: "Bring relevant information into a usable context." },
  {
    no: "03",
    name: "Normalize",
    description: "Make incompatible information understandable together.",
  },
  { no: "04", name: "Automate", description: "Move repetitive work from humans to computation." },
  {
    no: "05",
    name: "Verify",
    description: "Ensure actions and information can be traced and checked.",
  },
  {
    no: "06",
    name: "Inform",
    description: "Turn the result into understandable operational or decision material.",
  },
];
