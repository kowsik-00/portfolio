public class hi {

    public static void main(String[] args) {

        int[] arr = {-5, -3, -3, -1, -2, -5, -5, -3};

        int maxSum = arr[0];
        int currentSum = 0;

        for(int i = 0; i < arr.length; i++) {

            currentSum = currentSum + arr[i];

            if(currentSum > maxSum){
                maxSum = currentSum;
            }

            if(currentSum < 0){
                currentSum = 0;
            }
        }

        System.out.println("Maximum Subarray Sum: " + maxSum);
    }
}