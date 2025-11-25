import os
from typing import List
from openai import OpenAI
from fastapi import HTTPException, status
from functools import lru_cache


class AIService:
    """
    Thin wrapper around the OpenAI client to centralize prompts that we use across
    outline generation, section content creation, and refinement flows.
    """

    def __init__(self) -> None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY is not set.")
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.client = OpenAI(api_key=api_key)

    def _extract_text(self, response) -> str:
        try:
            content = response.choices[0].message.content
            if isinstance(content, list):
                return "".join(block.get("text", "") for block in content).strip()
            return str(content).strip()
        except Exception as exc:  # pragma: no cover
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Unable to parse response from OpenAI: {exc}",
            ) from exc

    def suggest_outline(self, document_type: str, main_topic: str) -> List[str]:
        if document_type not in {"docx", "pptx"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="document_type must be docx or pptx",
            )

        doc_label = "sections" if document_type == "docx" else "slide titles"
        prompt = (
            f"You are assisting with creating a structured business document about: {main_topic}.\n"
            f"Propose 6-8 concise {doc_label} in order. Each line should be a single heading without numbering."
        )
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert business analyst and presentation creator.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.4,
        )
        text = self._extract_text(response)
        lines = [line.strip("-• ").strip() for line in text.split("\n") if line.strip()]
        return [line for line in lines if line]

    def generate_section_content(
        self,
        document_type: str,
        main_topic: str,
        section_title: str,
        guidance: str | None = None,
    ) -> str:
        doc_context = (
            "a detailed narrative section suitable for a Word document"
            if document_type == "docx"
            else "concise bullet points suitable for a PowerPoint slide"
        )
        refinement = f"\nAdditional guidance: {guidance}" if guidance else ""
        prompt = (
            f"Main topic: {main_topic}\n"
            f"Section title: {section_title}\n"
            f"Create {doc_context} that flows professionally and keeps business readers in mind."
            f"{refinement}"
        )
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an analyst that drafts structured business reports and presentation slides. "
                        "IMPORTANT: Do NOT use markdown formatting. Do NOT use hashtags (#) for headings. "
                        "Write in plain text with proper paragraph structure. Use numbered lists (1. 2. 3.) "
                        "or simple dashes (-) for bullet points when needed."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.6,
        )
        return self._extract_text(response).strip()

    def refine_content(
        self,
        document_type: str,
        main_topic: str,
        section_title: str,
        current_content: str,
        prompt: str,
    ) -> str:
        doc_context = (
            "Word document section" if document_type == "docx" else "PowerPoint slide"
        )
        system_prompt = (
            "You enhance business documents while preserving factual accuracy and structure. "
            "IMPORTANT: Do NOT use markdown formatting. Do NOT use hashtags (#) for headings. "
            "Write in plain text with proper paragraph structure. Use numbered lists (1. 2. 3.) "
            "or simple dashes (-) for bullet points when needed."
        )
        user_prompt = (
            f"Main topic: {main_topic}\n"
            f"{doc_context}: {section_title}\n"
            f"Current content:\n{current_content}\n\n"
            f"User refinement request: {prompt}\n"
            "Return only the updated content in plain text without markdown."
        )
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.5,
        )
        return self._extract_text(response).strip()


@lru_cache
def get_ai_service() -> AIService:
    return AIService()

