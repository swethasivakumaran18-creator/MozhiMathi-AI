from app.schemas.lint import LintIssue


class TamilTechnicalLinter:
    def lint(self, text: str) -> list[LintIssue]:
        issues: list[LintIssue] = []

        if "TODO" in text:
            issues.append(
                LintIssue(
                    type="style",
                    message="Avoid unresolved TODO markers in technical Tamil content.",
                    suggestion="Replace TODO with a concrete Tamil technical instruction.",
                )
            )

        if any(char.isdigit() for char in text):
            issues.append(
                LintIssue(
                    type="terminology",
                    message="Numeric-heavy text detected.",
                    suggestion="Consider adding Tamil explanatory text around numeric data.",
                )
            )

        if len(text.split()) < 5:
            issues.append(
                LintIssue(
                    type="clarity",
                    message="Content is too short for robust technical linting.",
                    suggestion="Provide at least one detailed technical sentence in Tamil.",
                )
            )

        return issues


linter_service = TamilTechnicalLinter()
