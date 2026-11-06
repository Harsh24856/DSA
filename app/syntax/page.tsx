import { SyntaxView } from "@/components/SyntaxView";
import { CODE, OUT, OUT_BY_LANG } from "@/lib/syntax/code";

// Only this page reads the programs, so no other page ships them.
export default function SyntaxPage() { return <SyntaxView code={CODE} out={OUT} outBy={OUT_BY_LANG} />; }
