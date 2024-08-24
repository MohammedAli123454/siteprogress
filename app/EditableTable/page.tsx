"use client";

import * as React from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Trash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// Define the schema using Zod
const schema = z.object({
  invoiceNumber: z.string().optional(),
  invoiceDate: z.date({ required_error: "Invoice Date Required" }),
  paymentTerms: z.enum(["30 Days", "45 Days", "60 Days"], {
    required_error: "Payment Term Required",
  }),
  invoiceType: z.enum(["Credit", "Cash"], {
    required_error: "Invoice Type Required",
  }),
  items: z.array(
    z.object({
      code: z.string().min(1, "Select required"),
      description: z.string().min(1, "Description Required"),
      price: z.number().min(1, "Price Required"),
      qty: z.number().min(1, "Fill"),
      total: z.number().min(1, "Total Required"),
    })
  ),
});

// Infer the form's data type from the schema
type FormData = z.infer<typeof schema>;

export default function EditableForm() {
  const form = useForm<FormData>({
    defaultValues: {
      invoiceNumber: `INV-${Date.now()}`, // Auto-generated invoice number
      invoiceDate: undefined,
      paymentTerms: "30 Days",
      invoiceType: "Credit",
      items: [{ code: "", description: "", price: 0, qty: 1, total: 0 }],
    },
    resolver: zodResolver(schema),
    mode: "onSubmit",
  });
  const [invoiceDate, setInvoiceDate] = React.useState<Date | undefined>(new Date());

  const { control, watch, setValue, handleSubmit, formState: { errors } } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const itemsList = [
    { code: "001", description: "Item A", price: 100 },
    { code: "002", description: "Item B", price: 200 },
    { code: "003", description: "Item C", price: 300 },
  ];

  const calculateTotals = () => {
    const items = watch("items");
    let totalQty = 0;
    let grandTotal = 0;
    items.forEach((item) => {
      totalQty += item.qty;
      grandTotal += item.total;
    });
    return { totalQty, grandTotal };
  };

  const updateItemDetails = (index: number, code: string) => {
    const selectedItem = itemsList.find(item => item.code === code);
    if (selectedItem) {
      setValue(`items.${index}.description`, selectedItem.description);
      setValue(`items.${index}.price`, selectedItem.price);
      setValue(`items.${index}.total`, selectedItem.price * watch(`items.${index}.qty`));
    }
  };

  const { totalQty, grandTotal } = calculateTotals();

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  const handleAddRow = () => {
    append({ code: "", description: "", price: 0, qty: 1, total: 0 }, { shouldFocus: false });
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-4">
        {/* Invoice Number (Read Only) */}
        <Card className="mb-6">
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Invoice No */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Invoice No</label>
            <Input readOnly value="INV-00123" className="mt-1 border-gray-300" />
          </div>

          {/* Invoice Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Invoice Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full justify-start text-left font-normal mt-1"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {invoiceDate ? format(invoiceDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={invoiceDate}
                  onSelect={setInvoiceDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Payment Terms */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Terms</label>
            <Select>
              <SelectTrigger className="w-full mt-1 border-gray-300">
                <SelectValue placeholder="Select Terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="45">45 Days</SelectItem>
                <SelectItem value="60">60 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invoice Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Invoice Type</label>
            <Select>
              <SelectTrigger className="w-full mt-1 border-gray-300">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
        {/* Existing Items Table */}
        {fields.map((item, index) => (
          <div key={item.id} className="grid grid-cols-12 gap-4 items-end w-full pb-0">
            <div className="col-span-2">
              {index === 0 && <FormLabel>Item Code</FormLabel>}
              <FormField
                control={control}
                name={`items.${index}.code`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          updateItemDetails(index, value);
                        }}
                      >
                        <SelectTrigger className="w-full border-gray-300">
                          <SelectValue placeholder="Select Item" />
                        </SelectTrigger>
                        <SelectContent>
                          {itemsList.map((item) => (
                            <SelectItem key={item.code} value={item.code}>
                              {item.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage>
                      {errors.items?.[index]?.code?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-5">
              {index === 0 && <FormLabel>Description</FormLabel>}
              <FormField
                control={control}
                name={`items.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} readOnly className="border-gray-300"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-1.5">
              {index === 0 && <FormLabel>Price</FormLabel>}
              <FormField
                control={control}
                name={`items.${index}.price`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        className="border-gray-300"
                        onChange={(e) => {
                          const price = parseFloat(e.target.value);
                          field.onChange(price);
                          setValue(
                            `items.${index}.total`,
                            price * watch(`items.${index}.qty`)
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-1.5">
              {index === 0 && <FormLabel>Qty</FormLabel>}
              <FormField
                control={control}
                name={`items.${index}.qty`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        className="border-gray-300"
                        onChange={(e) => {
                          const qty = parseInt(e.target.value);
                          field.onChange(qty);
                          setValue(
                            `items.${index}.total`,
                            watch(`items.${index}.price`) * qty
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-2">
              {index === 0 && <FormLabel>Total</FormLabel>}
              <FormField
                control={control}
                name={`items.${index}.total`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} readOnly className="border-gray-300"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => remove(index)}
              className="col-span-1"
            >
              <Trash className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}

        {/* Totals Section */}
        <Separator className="my-4" />
        <div className="grid grid-cols-12 gap-4 items-end">
          <div className="col-span-6"></div>
          <div className="col-span-2 text-right font-semibold">Total Qty</div>
          <div className="col-span-1.5">
            <Input readOnly value={totalQty} className="border-gray-300 font-bold"/>
          </div>
          <div className="col-span-1.5 text-right font-semibold">Grand Total</div>
          <div className="col-span-2">
            <Input readOnly value={grandTotal} className="border-gray-300 font-bold"/>
          </div>
        </div>

        <Button type="button" variant="secondary" onClick={handleAddRow} className="mt-4">
          Add Row
        </Button>
        <Button type="submit" className="mt-4 ml-4">
          Submit
        </Button>
      </form>
    </Form>
  );
}


