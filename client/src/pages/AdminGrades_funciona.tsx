import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Plus, Save } from "lucide-react";
import { toast } from "sonner";

export default function AdminGrades() {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [grades, setGrades] = useState([
    { studentId: 1, studentName: "João Silva", grade1: 8.5, grade2: 8.0, grade3: 8.7, grade4: 9.0 },
    { studentId: 2, studentName: "Maria Santos", grade1: 7.5, grade2: 7.8, grade3: 7.2, grade4: 7.9 },
    { studentId: 3, studentName: "Pedro Oliveira", grade1: 6.5, grade2: 6.8, grade3: 6.2, grade4: 6.9 },
  ]);

  const handleGradeChange = (studentId: number, bimester: string, value: string) => {
    setGrades(
      grades.map((g) =>
        g.studentId === studentId
          ? { ...g, [bimester]: parseFloat(value) || 0 }
          : g
      )
    );
  };

  const handleSaveGrades = () => {
    toast.success("Notas salvas com sucesso!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-yellow-500" />
          Lançamento de Notas
        </h2>
        <p className="text-slate-600 mt-1">Insira notas e frequência dos alunos</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Selecione os Filtros</CardTitle>
          <CardDescription>Escolha o curso, disciplina e semestre</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Curso</label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um curso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administração</SelectItem>
                  <SelectItem value="gestao">Gestão</SelectItem>
                  <SelectItem value="contabil">Contabilidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Disciplina</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma disciplina" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prog">Programação I</SelectItem>
                  <SelectItem value="math">Matemática</SelectItem>
                  <SelectItem value="port">Português</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Semestre</label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um semestre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1º Semestre</SelectItem>
                  <SelectItem value="2">2º Semestre</SelectItem>
                  <SelectItem value="3">3º Semestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Notas */}
      <Card>
        <CardHeader>
          <CardTitle>Lançamento de Notas por Bimestre</CardTitle>
          <CardDescription>Digite as notas dos alunos (0 a 10)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Aluno</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-900">1º Bim</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-900">2º Bim</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-900">3º Bim</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-900">4º Bim</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-900">Média</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {grades.map((grade) => {
                  const average = (grade.grade1 + grade.grade2 + grade.grade3 + grade.grade4) / 4;
                  return (
                    <tr key={grade.studentId} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{grade.studentName}</td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={grade.grade1}
                          onChange={(e) => handleGradeChange(grade.studentId, "grade1", e.target.value)}
                          className="w-20 text-center"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={grade.grade2}
                          onChange={(e) => handleGradeChange(grade.studentId, "grade2", e.target.value)}
                          className="w-20 text-center"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={grade.grade3}
                          onChange={(e) => handleGradeChange(grade.studentId, "grade3", e.target.value)}
                          className="w-20 text-center"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={grade.grade4}
                          onChange={(e) => handleGradeChange(grade.studentId, "grade4", e.target.value)}
                          className="w-20 text-center"
                        />
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-900">
                        {average.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSaveGrades}
              className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar Notas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lançamento de Frequência */}
      <Card>
        <CardHeader>
          <CardTitle>Lançamento de Frequência</CardTitle>
          <CardDescription>Registre a frequência dos alunos (em %)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Aluno</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-900">Frequência (%)</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {grades.map((grade) => (
                  <tr key={grade.studentId} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{grade.studentName}</td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        placeholder="0"
                        className="w-24 text-center"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Bom
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSaveGrades}
              className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar Frequência
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
