declare module "jspdf/dist/jspdf.umd.min.js" {
  import { jsPDF } from "jspdf";

  const jspdf: {
    jsPDF: typeof jsPDF;
  };

  export default jspdf;
}
