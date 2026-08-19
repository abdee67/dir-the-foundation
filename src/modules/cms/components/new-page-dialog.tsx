'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { z } from 'zod'

import { slugify } from '@/lib/utils'
import { createPageAction } from '@/modules/cms/actions'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const formSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  slug: z.string().trim().min(1, 'Slug is required'),
  type: z.enum(['page', 'home', 'policy']),
})

type FormValues = z.infer<typeof formSchema>

function NewPageDialog() {
  const [open, setOpen] = React.useState(false)
  const [slugTouched, setSlugTouched] = React.useState(false)
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: '', slug: '', type: 'page' },
  })

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      form.reset()
      setSlugTouched(false)
    }
  }

  async function onSubmit(values: FormValues) {
    const result = await createPageAction(values)
    if (!result.ok || !result.data) {
      toast.error(!result.ok ? result.error : 'Something went wrong.')
      return
    }
    setOpen(false)
    router.push(`/admin/cms/pages/${result.data.id}`)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button">
          <Plus className="size-4" />
          New page
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New page</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        field.onChange(e)
                        if (!slugTouched) form.setValue('slug', slugify(e.target.value))
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        setSlugTouched(true)
                        field.onChange(e)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="page">Page</SelectItem>
                      <SelectItem value="home">Home</SelectItem>
                      <SelectItem value="policy">Policy</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating...' : 'Create page'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export { NewPageDialog }
