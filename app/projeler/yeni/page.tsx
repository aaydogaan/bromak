import { PageWrapper } from "@/components/page-wrapper"
import { NewProjectForm } from "@/components/new-project-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NewProjectPage() {
  return (
    <PageWrapper>
      <div className="p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="flex items-center gap-4">
            <Link href="/projeler">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Yeni Proje Ekle</h1>
              <p className="mt-2 text-muted-foreground">Yeni bir proje oluşturun ve detaylarını girin</p>
            </div>
          </div>

          <NewProjectForm />
        </div>
      </div>
    </PageWrapper>
  )
}
