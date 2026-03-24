import { Request, Response } from 'express'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const submitContact = async (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Name, email and message are required' })
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'FLAWS <onboarding@resend.dev>',
      to: process.env.CONTACT_EMAIL || 'support@flaws.co.za',
      replyTo: email,
      subject: `Contact Form: ${subject || 'New Message'} — ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:2rem;background:#0a0a0a;color:#fff;">
          <h2 style="font-size:1rem;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:2rem;">New Contact Form Submission</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:0.75rem 0;border-bottom:1px solid #1a1a1a;color:#888;font-size:0.8rem;width:100px;">Name</td><td style="padding:0.75rem 0;border-bottom:1px solid #1a1a1a;font-size:0.85rem;">${name}</td></tr>
            <tr><td style="padding:0.75rem 0;border-bottom:1px solid #1a1a1a;color:#888;font-size:0.8rem;">Email</td><td style="padding:0.75rem 0;border-bottom:1px solid #1a1a1a;font-size:0.85rem;"><a href="mailto:${email}" style="color:#fff;">${email}</a></td></tr>
            <tr><td style="padding:0.75rem 0;border-bottom:1px solid #1a1a1a;color:#888;font-size:0.8rem;">Subject</td><td style="padding:0.75rem 0;border-bottom:1px solid #1a1a1a;font-size:0.85rem;">${subject || '—'}</td></tr>
          </table>
          <div style="margin-top:2rem;">
            <p style="color:#888;font-size:0.8rem;margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:0.1em;">Message</p>
            <p style="font-size:0.85rem;line-height:1.8;color:#ccc;white-space:pre-wrap;">${message}</p>
          </div>
        </div>
      `,
    })

    res.json({ success: true })
  } catch (err: any) {
    console.error('Contact email error:', err)
    res.status(500).json({ message: 'Failed to send message' })
  }
}