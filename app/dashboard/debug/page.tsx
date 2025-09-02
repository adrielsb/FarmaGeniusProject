import { DatabaseTest } from '@/components/debug/db-test'

export default function DebugPage() {
  return (
    <div className="p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Debug & Diagnóstico</h1>
          <p className="text-gray-600">
            Ferramentas de debugging para diagnosticar problemas de conectividade e banco de dados.
          </p>
        </div>

        <DatabaseTest />
      </div>
    </div>
  )
}