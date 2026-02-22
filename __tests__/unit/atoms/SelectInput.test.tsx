import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SelectInput from '@/components/atoms/SelectInput'

describe('SelectInput Atom', () => {
  const mockOptions = [
    { value: 'school-league', label: 'School League' },
    { value: 'club-tournament', label: 'Club Tournament' },
    { value: 'adult', label: 'Adult' },
  ]

  describe('Rendering', () => {
    it('should render with a label', () => {
      render(
        <SelectInput
          label="Category"
          value=""
          onChange={() => {}}
          options={mockOptions}
        />
      )
      expect(screen.getByText('Category')).toBeInTheDocument()
    })

    it('should render all options when opened', async () => {
      const user = userEvent.setup()
      render(
        <SelectInput
          label="Category"
          value=""
          onChange={() => {}}
          options={mockOptions}
        />
      )

      // Click to open the listbox
      const button = screen.getByRole('button')
      await user.click(button)

      // Check all options are visible
      mockOptions.forEach(option => {
        expect(screen.getByText(option.label)).toBeInTheDocument()
      })
    })

    it('should display the selected value', () => {
      render(
        <SelectInput
          label="Category"
          value="adult"
          onChange={() => {}}
          options={mockOptions}
        />
      )

      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('Adult')
    })

    it('should show placeholder when no value selected', () => {
      render(
        <SelectInput
          label="Category"
          value=""
          onChange={() => {}}
          options={mockOptions}
          placeholder="Choose a category..."
        />
      )

      expect(screen.getByText('Choose a category...')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should call onChange when option selected', async () => {
      const handleChange = jest.fn()
      const user = userEvent.setup()

      render(
        <SelectInput
          label="Category"
          value=""
          onChange={handleChange}
          options={mockOptions}
        />
      )

      // Open the dropdown
      const button = screen.getByRole('button')
      await user.click(button)

      // Select an option
      const option = screen.getByText('Club Tournament')
      await user.click(option)

      expect(handleChange).toHaveBeenCalledWith('club-tournament')
    })

    it('should not call onChange when disabled', async () => {
      const handleChange = jest.fn()
      const user = userEvent.setup()

      render(
        <SelectInput
          label="Category"
          value=""
          onChange={handleChange}
          options={mockOptions}
          disabled
        />
      )

      // Try to click the disabled button
      const button = screen.getByRole('button')
      await user.click(button)

      // Options should not be shown
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
      expect(handleChange).not.toHaveBeenCalled()
    })

    it('should support keyboard navigation', async () => {
      const handleChange = jest.fn()
      const user = userEvent.setup()

      render(
        <SelectInput
          label="Category"
          value=""
          onChange={handleChange}
          options={mockOptions}
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      // Navigate down and select with Enter
      await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')

      expect(handleChange).toHaveBeenCalled()
    })
  })

  describe('States', () => {
    it('should show error state', () => {
      render(
        <SelectInput
          label="Category"
          value=""
          onChange={() => {}}
          options={mockOptions}
          error="Please select a category"
        />
      )

      expect(screen.getByText('Please select a category')).toBeInTheDocument()
      expect(screen.getByRole('button')).toHaveClass('border-red-500')
    })

    it('should show disabled state', () => {
      render(
        <SelectInput
          label="Category"
          value="adult"
          onChange={() => {}}
          options={mockOptions}
          disabled
        />
      )

      const button = screen.getByRole('button')
      expect(button).toHaveClass('cursor-not-allowed')
      expect(button).toHaveClass('opacity-60')
    })

    it('should show required indicator', () => {
      render(
        <SelectInput
          label="Category"
          value=""
          onChange={() => {}}
          options={mockOptions}
          required
        />
      )

      expect(screen.getByText('*')).toBeInTheDocument()
      expect(screen.getByText('*')).toHaveClass('text-red-500')
    })
  })

  describe('Option Groups', () => {
    it('should support grouped options', async () => {
      const user = userEvent.setup()
      const groupedOptions = [
        {
          group: 'School',
          options: [
            { value: 'school-league', label: 'School League' },
            { value: 'school-tournament', label: 'School Tournament' },
          ],
        },
        {
          group: 'Club',
          options: [
            { value: 'club-league', label: 'Club League' },
            { value: 'club-tournament', label: 'Club Tournament' },
          ],
        },
      ]

      render(
        <SelectInput
          label="Category"
          value=""
          onChange={() => {}}
          groupedOptions={groupedOptions}
        />
      )

      // Open the dropdown
      const button = screen.getByRole('button')
      await user.click(button)

      // Check that group headers are rendered
      expect(screen.getByText('School')).toBeInTheDocument()
      expect(screen.getByText('Club')).toBeInTheDocument()

      // Check that options are rendered
      expect(screen.getByText('School League')).toBeInTheDocument()
      expect(screen.getByText('Club Tournament')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have aria-invalid when error', () => {
      render(
        <SelectInput
          label="Category"
          value=""
          onChange={() => {}}
          options={mockOptions}
          error="Invalid selection"
        />
      )

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-invalid', 'true')
    })

    it('should have aria-describedby for error message', () => {
      render(
        <SelectInput
          label="Category"
          value=""
          onChange={() => {}}
          options={mockOptions}
          error="Error message"
        />
      )

      const button = screen.getByRole('button')
      const errorId = button.getAttribute('aria-describedby')
      expect(errorId).toBeTruthy()

      const errorElement = document.getElementById(errorId!)
      expect(errorElement).toHaveTextContent('Error message')
    })

    it('should show check icon for selected option', async () => {
      const user = userEvent.setup()
      render(
        <SelectInput
          label="Category"
          value="adult"
          onChange={() => {}}
          options={mockOptions}
        />
      )

      // Open the dropdown
      await user.click(screen.getByRole('button'))

      // Find the Adult option and check it has the check icon
      const adultOption = screen.getByText('Adult').closest('[role="option"]')
      expect(adultOption).toBeInTheDocument()

      // Check the selected option has font-medium class
      expect(within(adultOption!).getByText('Adult')).toHaveClass('font-medium')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty options array', () => {
      render(
        <SelectInput
          label="Category"
          value=""
          onChange={() => {}}
          options={[]}
          placeholder="No options available"
        />
      )

      expect(screen.getByText('No options available')).toBeInTheDocument()
    })

    it('should close dropdown when option is selected', async () => {
      const user = userEvent.setup()
      render(
        <SelectInput
          label="Category"
          value=""
          onChange={() => {}}
          options={mockOptions}
        />
      )

      // Open and select
      await user.click(screen.getByRole('button'))
      await user.click(screen.getByText('Adult'))

      // Listbox should be closed
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('should close dropdown on Escape key', async () => {
      const user = userEvent.setup()
      render(
        <SelectInput
          label="Category"
          value=""
          onChange={() => {}}
          options={mockOptions}
        />
      )

      // Open dropdown
      await user.click(screen.getByRole('button'))
      expect(screen.getByRole('listbox')).toBeInTheDocument()

      // Press Escape
      await user.keyboard('{Escape}')
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })
  })
})
