import type { Difficulty, Question, QuestionType, Topic } from "@mathquiztador/shared";
import { randomUUID } from "node:crypto";

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)] as T;
}

const topics: Topic[] = [
  "functions",
  "limits",
  "continuity",
  "derivatives",
  "function-study",
  "primitives",
  "integrals",
  "matrices",
  "determinants",
  "vectors",
  "trigonometry"
];

const questionTypes: QuestionType[] = [
  "numeric",
  "multiple-choice",
  "true-false",
  "expression-fill",
  "step-by-step"
];

export function generateQuestion(difficulty: Difficulty, forceHard = false): Question {
  const topic = pick(topics);
  const type = pick(questionTypes);
  const finalDifficulty = forceHard ? "hard" : difficulty;

  const id = randomUUID();

  switch (topic) {
    case "functions": {
      const a = randInt(1, 6);
      const b = randInt(-5, 5);
      const x = randInt(-4, 4);
      const answer = a * x + b;
      return {
        id,
        topic,
        type: "numeric",
        prompt: `Pentru f(x)= ${a}x ${b >= 0 ? "+" : ""}${b}, calculeaza f(${x}).`,
        answer,
        difficulty: finalDifficulty,
        timeLimitSec: 25
      };
    }
    case "limits": {
      const a = randInt(1, 8);
      const answer = a;
      return {
        id,
        topic,
        type: "expression-fill",
        prompt: `Calculeaza limita: lim(x->0) (sin(${a}x)/x).`,
        answer: String(answer),
        difficulty: finalDifficulty,
        timeLimitSec: 30
      };
    }
    case "continuity": {
      const x0 = randInt(-3, 3);
      return {
        id,
        topic,
        type: "true-false",
        prompt: `Adevarat/Fals: Functia polinomiala este continua in punctul x=${x0}.`,
        answer: true,
        difficulty: finalDifficulty,
        timeLimitSec: 20
      };
    }
    case "derivatives": {
      const n = randInt(2, 6);
      const coef = randInt(1, 7);
      return {
        id,
        topic,
        type: "numeric",
        prompt: `Pentru f(x)= ${coef}x^${n}, care este coeficientul lui x^${n - 1} in f'(x)?`,
        answer: coef * n,
        difficulty: finalDifficulty,
        timeLimitSec: 30
      };
    }
    case "function-study": {
      const a = randInt(1, 5);
      return {
        id,
        topic,
        type: "multiple-choice",
        prompt: `Pentru f(x)=x^2-${a}, punctul de minim este:`,
        options: ["(0, -a)", "(a,0)", "(-a,0)", "(0,a)"],
        answer: "(0, -a)",
        difficulty: finalDifficulty,
        timeLimitSec: 35
      };
    }
    case "primitives": {
      const p = randInt(1, 5);
      return {
        id,
        topic,
        type: "expression-fill",
        prompt: `Completeaza: ∫ x^${p} dx = x^${p + 1}/(?) + C`,
        answer: String(p + 1),
        difficulty: finalDifficulty,
        timeLimitSec: 30
      };
    }
    case "integrals": {
      const a = randInt(1, 5);
      const b = randInt(a + 1, a + 5);
      const result = (b * b - a * a) / 2;
      return {
        id,
        topic,
        type: "numeric",
        prompt: `Calculeaza ∫[${a},${b}] x dx`,
        answer: result,
        tolerance: 0.001,
        difficulty: finalDifficulty,
        timeLimitSec: 35
      };
    }
    case "matrices": {
      const a = randInt(1, 4);
      const b = randInt(1, 4);
      const c = randInt(1, 4);
      const d = randInt(1, 4);
      return {
        id,
        topic,
        type: "numeric",
        prompt: `M=[[${a},${b}],[${c},${d}]]. Care este urma matricei?`,
        answer: a + d,
        difficulty: finalDifficulty,
        timeLimitSec: 30
      };
    }
    case "determinants": {
      const a = randInt(1, 6);
      const b = randInt(1, 6);
      const c = randInt(1, 6);
      const d = randInt(1, 6);
      return {
        id,
        topic,
        type: "numeric",
        prompt: `det([[${a},${b}],[${c},${d}]]) = ?`,
        answer: a * d - b * c,
        difficulty: finalDifficulty,
        timeLimitSec: 30
      };
    }
    case "vectors": {
      const x1 = randInt(1, 5);
      const y1 = randInt(1, 5);
      const x2 = randInt(1, 5);
      const y2 = randInt(1, 5);
      return {
        id,
        topic,
        type: "numeric",
        prompt: `Pentru u=(${x1},${y1}) si v=(${x2},${y2}), calculeaza produsul scalar u·v`,
        answer: x1 * x2 + y1 * y2,
        difficulty: finalDifficulty,
        timeLimitSec: 30
      };
    }
    case "trigonometry": {
      const option = pick([
        { prompt: "sin(pi/2)", answer: "1" },
        { prompt: "cos(pi)", answer: "-1" },
        { prompt: "tan(pi/4)", answer: "1" }
      ]);
      return {
        id,
        topic,
        type: "true-false",
        prompt: `Adevarat/Fals: ${option.prompt} = ${option.answer}`,
        answer: true,
        difficulty: finalDifficulty,
        timeLimitSec: 20
      };
    }
    default:
      throw new Error("Unsupported topic");
  }
}

export function isCorrectAnswer(question: Question, rawAnswer: string): boolean {
  const normalized = rawAnswer.trim().toLowerCase();

  if (typeof question.answer === "boolean") {
    return ["true", "adevarat", "1"].includes(normalized) === question.answer;
  }

  if (typeof question.answer === "number") {
    const parsed = Number(normalized.replace(",", "."));
    if (Number.isNaN(parsed)) return false;
    const tolerance = question.tolerance ?? 0;
    return Math.abs(parsed - question.answer) <= tolerance;
  }

  return normalized === String(question.answer).trim().toLowerCase();
}
