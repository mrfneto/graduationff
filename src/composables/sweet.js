// composables/sweet.js
import Swal from 'sweetalert2'

const btnColor = color => {
  const base =
    'inline-flex px-4 py-2 items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer'

  const variant = {
    primary:
      'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500',
    secondary:
      'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
  }

  return [base, variant[color]].join(' ')
}

const sweet = {
  async confirm(title, text = '', type = 'question') {
    const result = await Swal.fire({
      title,
      text,
      icon: type,
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: btnColor('primary'),
        cancelButton: btnColor('secondary'),
        actions: 'space-x-2'
      },
      buttonsStyling: false
    })
    return result.isConfirmed
  },

  alert(title, text = '', type = 'info') {
    return Swal.fire({
      title,
      text,
      icon: type,
      confirmButtonText: 'OK',
      customClass: {
        confirmButton: btnColor('primary')
      },
      buttonsStyling: false
    })
  },

  success(title, text = '') {
    return sweet.alert(title, text, 'success')
  },

  error(title, text = '') {
    return sweet.alert(title, text, 'error')
  },

  warning(title, text = '') {
    return sweet.alert(title, text, 'warning')
  },

  info(title, text = '') {
    return sweet.alert(title, text, 'info')
  }
}

export default sweet
