/**
 * FormatterService handles message formatting
 */
export class FormatterService {
  private readonly template: string;

  constructor() {
    this.template = `🌅 *Standup #%s - %s*

👨‍💼 *Meeting Leader:* %s will facilitate today's standup!

Good morning team! 👋 Let's crush it today!

✅ *Done* - What you completed (include tickets: PROJ-123)

📋 *Todo* - What you're working on today (tickets + due dates: "BUG-123 - due Friday")

🚧 *Blockers* - Any issues blocking you?

📝 *Example Format:*
\`\`\`
✅ Done:
- Implemented user authentication - PROJ-123
- Fixed pagination bug - BUG-456

📋 Todo:
- Add password reset feature - PROJ-124 - due Friday
- Review API documentation - DOC-789 - due tomorrow

🚧 Blockers:
- Waiting for API keys from DevOps team
\`\`\`

_Reply in thread. Remember to add due dates!_`;
  }

  /**
   * FormatStandupMessage formats a standup message with the given parameters
   */
  formatStandupMessage(teamName: string, leaderName: string, date: Date): string {
    const formattedDate = this.formatDate(date);
    return this.template
      .replace('%s', teamName)
      .replace('%s', formattedDate)
      .replace('%s', leaderName);
  }

  /**
   * Format date in the format: Monday, January 2, 2006
   */
  private formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  }
}
