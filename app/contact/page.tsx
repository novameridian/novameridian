"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, MessageCircle, Send, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MarketingShell } from "@/components/marketing/marketing-shell"
import { PageHero } from "@/components/marketing/page-hero"
import { SUPPORT_EMAIL, TELEGRAM_URL } from "@/lib/site"

export default function ContactPage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
        }),
      })

      const data = await res.json()

      if (data.ok) {
        toast({ title: "Message sent", description: "Thank you. We will reply as soon as we can." })

        // clear form
        setName("")
        setEmail("")
        setSubject("")
        setMessage("")
      } else {
        toast({ title: "Message not sent", description: "Please check your details and try again.", variant: "destructive" })
        console.error("Contact form sending error:", data)
      }
    } catch (err) {
        toast({ title: "Something went wrong", description: "Please try again in a moment.", variant: "destructive" })
        console.error("Contact form error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <MarketingShell>
      <PageHero
        eyebrow="Contact"
        title="Talk to the team."
        description="Questions about your account, a deposit or a withdrawal? Send us a message and we will get back to you through Telegram."
      />

      <section className="py-16 lg:py-24">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:gap-8 lg:px-8">
          {/* Channels */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-border bg-card p-6">
              <MessageCircle className="size-5 text-brand-ink" aria-hidden="true" />
              <h2 className="text-h3 mt-4">Telegram</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">The quickest way to reach us, including for deposit confirmations.</p>
              <Button asChild className="mt-5 w-full" variant="brand">
                <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">Open Telegram</a>
              </Button>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <Mail className="size-5 text-brand-ink" aria-hidden="true" />
              <h2 className="text-h3 mt-4">Email</h2>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="mt-1.5 inline-block text-sm text-body underline-offset-4 hover:text-foreground hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <Clock className="size-5 text-brand-ink" aria-hidden="true" />
              <h2 className="text-h3 mt-4">Response times</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                We read every message and reply as soon as we can.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-9">
            <h2 className="text-h2">Send a message</h2>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Full name</Label>
                  <Input
                    id="contact-name"
                    autoComplete="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-subject">Subject</Label>
                <Input
                  id="contact-subject"
                  placeholder="What is this about?"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-message">Message</Label>
                <Textarea
                  id="contact-message"
                  placeholder="Tell us how we can help"
                  className="min-h-[160px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" size="lg" className="w-full" loading={loading}>
                {!loading && <Send />}
                {loading ? "Sending…" : "Send message"}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
