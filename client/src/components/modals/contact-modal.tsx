import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { authService, getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Product, Supplier } from "@shared/schema";

interface ContactModalProps {
  supplier: Supplier;
  product?: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ContactModal({ supplier, product, open, onOpenChange }: ContactModalProps) {
  const [formData, setFormData] = useState({
    subject: product ? `Inquiry about ${product.name}` : 'General Inquiry',
    message: '',
    quantity: product ? product.minOrder : 1,
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = authService.getCurrentUser();

  const inquiryMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/inquiries', 'POST', data, getAuthHeaders());
    },
    onSuccess: () => {
      toast({
        title: "Inquiry submitted",
        description: "Your inquiry has been submitted for review and will be forwarded to the supplier once approved",
      });
      onOpenChange(false);
      setFormData({
        subject: product ? `Inquiry about ${product.name}` : 'General Inquiry',
        message: '',
        quantity: product ? product.minOrder : 1,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to send inquiries",
        variant: "destructive",
      });
      return;
    }

    if (currentUser.role !== 'buyer') {
      toast({
        title: "Not available",
        description: "Only buyers can send inquiries",
        variant: "destructive",
      });
      return;
    }

    inquiryMutation.mutate({
      supplierId: supplier.id,
      productId: product?.id,
      ...formData,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Contact Supplier</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Subject"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Please provide details about your requirements..."
              rows={4}
              required
            />
          </div>
          
          {product && (
            <div>
              <Label htmlFor="quantity">Quantity Needed</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                min={product.minOrder}
                required
              />
            </div>
          )}
          
          <div className="flex space-x-3">
            <Button 
              type="submit" 
              className="flex-1 bg-primary text-white hover:bg-blue-700"
              disabled={inquiryMutation.isPending}
            >
              {inquiryMutation.isPending ? 'Sending...' : 'Send Inquiry'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
