
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PaperFormData, PAPER_CATEGORIES } from "@/services/papers/types";
import { addPaper } from "@/services/papers/papersService";
import { toast } from "@/hooks/use-toast";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

interface AddPaperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaperAdded: () => void;
}

export function AddPaperDialog({ open, onOpenChange, onPaperAdded }: AddPaperDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState<PaperFormData>({
    title: "",
    authors: "",
    abstract: "",
    publication_date: "",
    journal: "",
    doi: "",
    keywords: "",
    categories: [],
    file: null,
  });

  const resetForm = () => {
    setFormData({
      title: "",
      authors: "",
      abstract: "",
      publication_date: "",
      journal: "",
      doi: "",
      keywords: "",
      categories: [],
      file: null,
    });
    setSelectedDate(undefined);
    setSelectedCategories([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] });
    }
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, category]);
    } else {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.authors) {
      toast({
        title: "Missing information",
        description: "Title and authors are required.",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare publication date from selected date
      const publicationDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;
      
      // Add selected categories
      const dataToSubmit = {
        ...formData,
        publication_date: publicationDate,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined
      };
      
      const result = await addPaper(dataToSubmit);
      
      if (result) {
        resetForm();
        onPaperAdded();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error adding paper:", error);
      toast({
        title: "Error",
        description: "Failed to add the paper. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Research Paper</DialogTitle>
          <DialogDescription>
            Enter the details of the research paper to add it to the repository.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="authors">Authors <span className="text-destructive">*</span></Label>
              <Input
                id="authors"
                name="authors"
                value={formData.authors}
                onChange={handleInputChange}
                placeholder="Author names separated by commas"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="abstract">Abstract</Label>
              <Textarea
                id="abstract"
                name="abstract"
                value={formData.abstract}
                onChange={handleInputChange}
                placeholder="Abstract of the research paper"
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="publication_date">Publication Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="journal">Journal</Label>
                <Input
                  id="journal"
                  name="journal"
                  value={formData.journal}
                  onChange={handleInputChange}
                  placeholder="Journal name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="doi">DOI</Label>
                <Input
                  id="doi"
                  name="doi"
                  value={formData.doi}
                  onChange={handleInputChange}
                  placeholder="Digital Object Identifier"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="keywords">Keywords</Label>
                <Input
                  id="keywords"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleInputChange}
                  placeholder="Keywords separated by commas"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Categories (select up to 5)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1 max-h-[150px] overflow-y-auto border rounded-md p-2">
                {PAPER_CATEGORIES.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={(checked) => 
                        handleCategoryChange(category, checked === true)
                      }
                      disabled={
                        !selectedCategories.includes(category) && 
                        selectedCategories.length >= 5
                      }
                    />
                    <Label
                      htmlFor={`category-${category}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="file">Upload Paper (PDF)</Label>
              <Input
                id="file"
                name="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf"
              />
              <p className="text-xs text-muted-foreground">
                Maximum file size: 10MB. Format: PDF.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Paper"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
