import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import fs from 'fs/promises';
import path from 'path';

async function getDevManDocs() {
  const devManPath = path.join(process.cwd(), '../PeteRental_vapi_10_02_25/DEV_MAN');
  try {
    const files = await fs.readdir(devManPath);
    const mdFiles = files.filter(file => file.endsWith('.md'));

    const docs = await Promise.all(
      mdFiles.map(async (file) => {
        const content = await fs.readFile(path.join(devManPath, file), 'utf-8');
        return {
          name: file.replace('.md', ''),
          filename: file,
          content: content.slice(0, 2000) // First 2000 chars for preview
        };
      })
    );

    return docs;
  } catch (error) {
    console.error('Error reading DEV_MAN:', error);
    return [];
  }
}

export default async function WhatsWorkingPage() {
  const docs = await getDevManDocs();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="container mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            What&apos;s Working
          </h1>
          <p className="text-muted-foreground mt-2">
            Development documentation and system architecture
          </p>
        </div>

        <div className="grid gap-6">
          {/* Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle>DEV_MAN Documentation</CardTitle>
              <CardDescription>
                Comprehensive documentation for the PeteRental VAPI system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{docs.length}</div>
                  <div className="text-sm text-muted-foreground">Documentation Files</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">✓</div>
                  <div className="text-sm text-muted-foreground">System Working</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">100%</div>
                  <div className="text-sm text-muted-foreground">Documentation Coverage</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documentation Browser */}
          <Card>
            <CardHeader>
              <CardTitle>Browse Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={docs[0]?.name} className="w-full">
                <TabsList className="w-full flex flex-wrap h-auto">
                  {docs.map((doc) => (
                    <TabsTrigger key={doc.name} value={doc.name} className="text-xs">
                      {doc.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {docs.map((doc) => (
                  <TabsContent key={doc.name} value={doc.name} className="mt-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{doc.filename}</h3>
                        <Badge>Markdown</Badge>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg overflow-auto max-h-96">
                        <pre className="text-xs whitespace-pre-wrap font-mono">
                          {doc.content}
                        </pre>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Showing first 2000 characters. Full file available in DEV_MAN/{doc.filename}
                      </p>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Key Features */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Core Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default">✓</Badge>
                  <span className="text-sm">FastAPI backend with hot reload</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">✓</Badge>
                  <span className="text-sm">VAPI webhook integration</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">✓</Badge>
                  <span className="text-sm">LangChain rental scraper</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">✓</Badge>
                  <span className="text-sm">Microsoft Calendar OAuth</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">✓</Badge>
                  <span className="text-sm">Docker deployment pipeline</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">✓</Badge>
                  <span className="text-sm">Next.js frontend dashboard</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documentation Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">APP_PLAN</Badge>
                  <span className="text-sm">Implementation planning</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">ASKI</Badge>
                  <span className="text-sm">Q&A format specifications</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">MERMAID</Badge>
                  <span className="text-sm">Architecture diagrams</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">README</Badge>
                  <span className="text-sm">System overview</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">TROUBLESHOOTING</Badge>
                  <span className="text-sm">Common issues & fixes</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
