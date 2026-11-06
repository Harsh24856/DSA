import { SyntaxView } from "@/components/SyntaxView";
import { CODE, OUT } from "@/lib/syntax/code";

// Only this page reads the programs, so no other page ships them.
export default function SyntaxPage() { return <SyntaxView code={CODE} out={OUT} />; }
